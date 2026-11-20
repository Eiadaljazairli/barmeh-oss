import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class AbuseService {
  private readonly logger = new Logger(AbuseService.name);

  constructor(
    private prisma: PrismaService,
    private ai: AIService,
    private eventEmitter: EventEmitter2,
  ) {}

  async evaluateListing(
    userId: string,
    price: number,
    categoryId: string,
    city: string,
    title?: string,
    description?: string,
  ) {
    if (title || description) {
      const contentToModerate = `${title || ''} ${description || ''}`;
      const moderation = await this.ai.moderateText(contentToModerate);
      if (!moderation.isSafe) {
        this.logger.warn(`AI flagged listing content: ${moderation.reason}`);
        return {
          isSafe: false,
          suspiciousScore: 10,
          action: 'BLOCKED',
          reason: moderation.reason,
        };
      }
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new ForbiddenException('User not found');

    if (user.isBlocked) {
      return {
        isSafe: false,
        suspiciousScore: 10,
        action: 'FLAGGED',
        reason: 'User is shadow banned',
      };
    }

    let suspiciousScore = 0;
    const now = new Date();
    const accountAgeHours =
      Math.abs(now.getTime() - user.createdAt.getTime()) / 36e5;

    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const recentListingsCount = await this.prisma.listing.count({
      where: { userId, createdAt: { gte: last24h } },
    });

    if (accountAgeHours < 24 && recentListingsCount >= 3) {
      this.logger.warn(
        `User ${userId} created too many listings in 24h. Applying Shadow Ban.`,
      );
      await this.applyShadowBan(userId);
      return {
        isSafe: false,
        suspiciousScore: 10,
        action: 'FLAGGED',
      };
    }

    const medianPrice = await this.getMedianPrice(categoryId, city);
    if (medianPrice > 0 && price < medianPrice * 0.5) {
      suspiciousScore += 1;
      this.logger.warn(
        `User ${userId} posted an underpriced item. Score: ${suspiciousScore}`,
      );
    }

    const isSuspicious = suspiciousScore > 0;

    return {
      isSafe: !isSuspicious,
      suspiciousScore,
      action: isSuspicious ? 'FLAGGED' : 'CLEARED',
    };
  }

  private async applyShadowBan(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: true },
    });

    this.eventEmitter.emit('user.shadow_banned', userId);
  }

  private async getMedianPrice(
    categoryId: string,
    city: string,
  ): Promise<number> {
    const agg = await this.prisma.listing.aggregate({
      _avg: { price: true },
      where: { categoryId, city: city as any, status: 'ACTIVE' },
    });
    return agg._avg.price || 0;
  }
}
