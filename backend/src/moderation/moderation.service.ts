import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { ModerationStatus, Prisma } from '@prisma/client';
import { FORBIDDEN_KEYWORDS } from '../listings/forbidden.keywords';
import { normalizeArabic, normalizeAggressive } from './normalizer';
import {
  containsPhoneNumber,
  findExternalPlatformMention,
  containsExternalUrl,
} from './patterns';

export interface ModerationDecision {
  status: ModerationStatus;
  score?: number;
  reason?: string;
  flaggedBy?: string;
  matchedKeyword?: string;
}

@Injectable()
export class ModerationService {
  private readonly logger = new Logger(ModerationService.name);

  static readonly REPORT_AUTO_HIDE_THRESHOLD = 3;

  constructor(
    private prisma: PrismaService,
    private ai: AIService,
  ) {}

  async moderateText(
    text: string,
    context: 'listing' | 'message' | 'profile' = 'listing',
  ): Promise<ModerationDecision> {
    if (!text?.trim()) {
      return { status: ModerationStatus.APPROVED };
    }

    const staticResult = this.staticCheck(text);
    if (staticResult.status === ModerationStatus.AUTO_REJECTED) {
      this.logger.warn(
        `[${context}] static filter rejected: ${staticResult.reason}`,
      );
      return staticResult;
    }

    let aiResult: { isSafe: boolean; reason?: string };
    try {
      aiResult = await this.ai.moderateText(text);
    } catch (err: any) {
      this.logger.error(
        `[${context}] Gemini moderation failed, falling back to static result: ${err?.message}`,
      );
      return staticResult;
    }

    if (!aiResult.isSafe) {
      return {
        status: ModerationStatus.FLAGGED,
        reason: aiResult.reason || 'AI flagged content',
        flaggedBy: 'gemini',
      };
    }

    if (staticResult.status === ModerationStatus.FLAGGED) {
      return staticResult;
    }

    return { status: ModerationStatus.APPROVED, flaggedBy: 'gemini' };
  }

  staticCheck(text: string): ModerationDecision {
    const normalized = normalizeArabic(text);
    const aggressive = normalizeAggressive(text);

    for (const keyword of FORBIDDEN_KEYWORDS) {
      const normalizedKeyword = normalizeArabic(keyword);
      if (!normalizedKeyword) continue;

      const escaped = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const exactRegex = new RegExp(`(^|\\s)${escaped}($|\\s|[,.!?;])`, 'i');
      if (exactRegex.test(normalized)) {
        return {
          status: ModerationStatus.AUTO_REJECTED,
          reason: `كلمة ممنوعة: "${keyword}"`,
          flaggedBy: 'static',
          matchedKeyword: keyword,
        };
      }

      const aggressiveKeyword = normalizedKeyword.replace(/\s+/g, '');
      if (
        aggressiveKeyword.length >= 4 &&
        aggressive.includes(aggressiveKeyword)
      ) {
        return {
          status: ModerationStatus.AUTO_REJECTED,
          reason: `كلمة ممنوعة (محاولة تحايل): "${keyword}"`,
          flaggedBy: 'static',
          matchedKeyword: keyword,
        };
      }
    }

    if (containsPhoneNumber(text)) {
      return {
        status: ModerationStatus.FLAGGED,
        reason: 'يحوي رقم هاتف (يُفضّل التواصل عبر المنصّة)',
        flaggedBy: 'static',
      };
    }

    const platform = findExternalPlatformMention(text);
    if (platform) {
      return {
        status: ModerationStatus.FLAGGED,
        reason: `يحوي إشارة لمنصّة خارجيّة (${platform})`,
        flaggedBy: 'static',
      };
    }

    if (containsExternalUrl(text)) {
      return {
        status: ModerationStatus.FLAGGED,
        reason: 'يحوي رابط خارجي',
        flaggedBy: 'static',
      };
    }

    return { status: ModerationStatus.APPROVED };
  }

  async moderateImage(
    buffer: Buffer,
    mimeType: string,
  ): Promise<ModerationDecision> {
    try {
      const result = await this.ai.moderateImage(buffer, mimeType);
      if (!result.isSafe) {
        return {
          status: ModerationStatus.FLAGGED,
          reason: result.reason || 'محتوى صورة غير لائق',
          flaggedBy: 'gemini',
        };
      }
      return { status: ModerationStatus.APPROVED, flaggedBy: 'gemini' };
    } catch (err: any) {
      this.logger.error(`Image moderation failed: ${err?.message}`);
      return { status: ModerationStatus.PENDING };
    }
  }

  async logDecision(params: {
    listingId?: string;
    messageId?: string;
    userId?: string;
    decision: ModerationStatus;
    reason?: string;
    source: string;
    rawResponse?: any;
  }) {
    try {
      await this.prisma.moderationLog.create({
        data: {
          listingId: params.listingId,
          messageId: params.messageId,
          userId: params.userId,
          decision: params.decision,
          reason: params.reason,
          source: params.source,
          rawResponse: params.rawResponse
            ? (params.rawResponse as Prisma.InputJsonValue)
            : undefined,
        },
      });
    } catch (err: any) {
      this.logger.error(`Failed to write moderation log: ${err?.message}`);
    }
  }

  async onListingReported(listingId: string): Promise<void> {
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: { reportCount: { increment: 1 } },
      select: { reportCount: true, moderationStatus: true },
    });

    if (
      updated.reportCount >= ModerationService.REPORT_AUTO_HIDE_THRESHOLD &&
      updated.moderationStatus === ModerationStatus.APPROVED
    ) {
      await this.prisma.listing.update({
        where: { id: listingId },
        data: {
          moderationStatus: ModerationStatus.FLAGGED,
          moderationReason: `تجاوز ${updated.reportCount} بلاغ`,
          moderationFlaggedBy: 'user_report',
        },
      });
      await this.logDecision({
        listingId,
        decision: ModerationStatus.FLAGGED,
        reason: `Auto-hidden after ${updated.reportCount} reports`,
        source: 'user_report',
      });
      this.logger.warn(
        `Listing ${listingId} auto-flagged after ${updated.reportCount} user reports`,
      );
    }
  }

  async getQueue(opts: { limit?: number; offset?: number } = {}) {
    const { limit = 50, offset = 0 } = opts;
    return this.prisma.listing.findMany({
      where: {
        moderationStatus: {
          in: [ModerationStatus.FLAGGED, ModerationStatus.PENDING],
        },
        deletedAt: null,
      },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true },
        },
        images: { take: 1, select: { thumbUrl: true, mediumUrl: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  async approveListing(listingId: string, adminId: string) {
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        moderationStatus: ModerationStatus.APPROVED,
        moderationReason: null,
      },
    });
    await this.logDecision({
      listingId,
      userId: adminId,
      decision: ModerationStatus.APPROVED,
      source: 'admin',
    });
    return updated;
  }

  async rejectListing(listingId: string, adminId: string, reason: string) {
    const updated = await this.prisma.listing.update({
      where: { id: listingId },
      data: {
        moderationStatus: ModerationStatus.REJECTED,
        moderationReason: reason,
        status: 'BLOCKED',
      },
    });
    await this.logDecision({
      listingId,
      userId: adminId,
      decision: ModerationStatus.REJECTED,
      reason,
      source: 'admin',
    });
    return updated;
  }

  async getStats() {
    const [pending, flagged, approved, rejected] = await Promise.all([
      this.prisma.listing.count({
        where: { moderationStatus: ModerationStatus.PENDING, deletedAt: null },
      }),
      this.prisma.listing.count({
        where: { moderationStatus: ModerationStatus.FLAGGED, deletedAt: null },
      }),
      this.prisma.listing.count({
        where: { moderationStatus: ModerationStatus.APPROVED, deletedAt: null },
      }),
      this.prisma.listing.count({
        where: {
          moderationStatus: {
            in: [ModerationStatus.REJECTED, ModerationStatus.AUTO_REJECTED],
          },
          deletedAt: null,
        },
      }),
    ]);
    return { pending, flagged, approved, rejected };
  }
}
