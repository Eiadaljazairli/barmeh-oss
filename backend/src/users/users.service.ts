import {
  Injectable,
  NotFoundException,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { AIService } from '../ai/ai.service';
import * as bcrypt from 'bcrypt';
import * as argon2 from 'argon2';
import { City } from '@prisma/client';
import { isValidRealName, sanitize } from '../common/utils/validation';
import { ChatGateway } from '../chat/chat.gateway';

import { UpdateProfileDto } from './dto/update-profile.dto';

export interface SupportTicketDto {
  subject: string;
  description: string;
  city?: City;
  attachments?: { fileUrl: string; fileType: string }[];
}

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private prisma: PrismaService,
    private search: SearchService,
    private ai: AIService,
    private chatGateway: ChatGateway,
  ) {}

  async countAll() {
    return this.prisma.user.count({
      where: { isDeleted: false },
    });
  }

  async findAllAdmin() {
    const users = await this.prisma.user.findMany({
      where: { isDeleted: false },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        isAdmin: true,
        isBlocked: true,
        createdAt: true,
      },
    });

    return users.map((u) => ({
      ...u,
      name:
        [u.firstName, u.lastName].filter(Boolean).join(' ') ||
        u.username ||
        'مستخدم',
    }));
  }

  async toggleBlock(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { isBlocked: !user.isBlocked },
    });

    if (updatedUser.isBlocked) {
      try {
        const userListings = await this.prisma.listing.findMany({
          where: { userId: updatedUser.id },
          select: { id: true },
        });
        for (const listing of userListings) {
          await this.search.removeListing(listing.id);
        }
      } catch (err) {
        this.logger.error(
          `Failed to remove listings for blocked user ${userId}`,
          err,
        );
      }
    }

    return updatedUser;
  }

  async toggleAdmin(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    return this.prisma.user.update({
      where: { id: userId },
      data: { isAdmin: !user.isAdmin },
    });
  }

  async getMe(userId: string) {
    if (
      !userId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        userId,
      )
    ) {
      throw new BadRequestException('معرف المستخدم غير صالح');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        email: true,
        avatarUrl: true,
        age: true,
        gender: true,
        governorate: true,
        userType: true,
        trustScore: true,
        isAdmin: true,
        createdAt: true,
        trustLevel: true,
        isEmailVerified: true,
        _count: { select: { listings: true, favorites: true } },
      },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');

    return {
      ...user,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        (user as any).username ||
        'مستخدم',
    };
  }

  async getMeStats(userId: string) {
    if (
      !userId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        userId,
      )
    ) {
      throw new BadRequestException('معرف المستخدم غير صالح');
    }

    const [activeListings, unreadMessages, reviewAgg] = await Promise.all([
      this.prisma.listing.count({
        where: { userId, status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.message.count({
        where: {
          senderId: { not: userId },
          readAt: null,
          deletedForReceiver: false,
          deletedAt: null,
          chat: { OR: [{ userAId: userId }, { userBId: userId }] },
        },
      }),
      this.prisma.review.aggregate({
        where: { reviewedUserId: userId },
        _avg: { rating: true },
        _count: { _all: true },
      }),
    ]);

    return {
      activeListings,
      unreadMessages,
      reviewsCount: reviewAgg._count._all,
      averageRating: reviewAgg._avg.rating
        ? Number(reviewAgg._avg.rating.toFixed(1))
        : 0,
    };
  }

  async getPublicProfile(userId: string) {
    if (
      !userId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        userId,
      )
    ) {
      throw new BadRequestException('معرف المستخدم غير صالح');
    }
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatarUrl: true,
        trustScore: true,
        trustLevel: true,
        createdAt: true,
        userType: true,
        _count: { select: { listings: true } },
      },
    });
    if (!user) throw new NotFoundException('المستخدم غير موجود');
    return {
      ...user,
      name:
        [user.firstName, user.lastName].filter(Boolean).join(' ') ||
        (user as any).username ||
        'مستخدم',
    };
  }

  async updateLocation(userId: string, lat: number, lng: number) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        lastLocationLat: lat,
        lastLocationLng: lng,
      },
    });
  }

  async deleteAccount(userId: string): Promise<void> {
    const listings = await this.prisma.listing.findMany({
      where: { userId },
      select: { id: true },
    });

    await this.prisma.$transaction([
      this.prisma.listing.deleteMany({
        where: { userId, status: { not: 'BLOCKED' } },
      }),
      this.prisma.report.deleteMany({ where: { reporterId: userId } }),
      this.prisma.favorite.deleteMany({ where: { userId } }),

      this.prisma.user.update({
        where: { id: userId },
        data: {
          email: null,
          firstName: 'مستخدم',
          lastName: 'محذوف',
          avatarUrl: null,
          isBlocked: true,
          isDeleted: true,
        },
      }),
    ]);

    await Promise.allSettled(
      listings.map((l) => this.search.removeListing(l.id)),
    );

    this.logger.log(
      `Account anonymized to preserve chats: user=${userId}, listings=${listings.length}`,
    );
  }

  async reportUser(
    reporterId: string,
    reportedUserId: string,
    reason: string,
  ): Promise<void> {
    if (reporterId === reportedUserId) {
      throw new BadRequestException('لا يمكنك الإبلاغ عن نفسك');
    }

    const targetUser = await this.prisma.user.findUnique({
      where: { id: reportedUserId },
    });
    if (!targetUser) throw new NotFoundException('المستخدم غير موجود');

    const existing = await this.prisma.report.findFirst({
      where: { reporterId, reportedUserId },
    });
    if (existing) {
      throw new BadRequestException('لقد قمت بالإبلاغ عن هذا الشخص مسبقاً');
    }

    const report = await this.prisma.report.create({
      data: {
        reporterId,
        reportedUserId,
        reason,
      },
      include: {
        reporter: { select: { firstName: true, lastName: true } },
        reportedUser: { select: { firstName: true, lastName: true } },
      },
    });

    this.chatGateway.emitToAdmins('new_report', {
      id: report.id,
      reporterName:
        (report.reporter?.firstName || 'Unknown') +
        ' ' +
        (report.reporter?.lastName || ''),
      reportedName:
        (report.reportedUser?.firstName || 'Unknown') +
        ' ' +
        (report.reportedUser?.lastName || ''),
      reason: report.reason,
      createdAt: report.createdAt,
    });

    this.logger.log(
      `User ${reporterId} reported User ${reportedUserId} for: ${reason}`,
    );
  }

  async createSupportTicket(userId: string, data: SupportTicketDto) {
    const ticket = await this.prisma.supportTicket.create({
      data: {
        userId,
        subject: data.subject,
        description: data.description,
        city: data.city,
        attachments: data.attachments?.length
          ? {
              create: data.attachments.map((a) => ({
                fileUrl: a.fileUrl,
                fileType: a.fileType,
              })),
            }
          : undefined,
      },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
    });

    this.chatGateway.emitToAdmins('new_ticket', {
      id: ticket.id,
      userName:
        (ticket.user?.firstName || 'Unknown') +
        ' ' +
        (ticket.user?.lastName || ''),
      subject: ticket.subject,
      city: ticket.city,
      createdAt: ticket.createdAt,
    });

    return ticket;
  }

  async replyToTicket(
    userId: string,
    ticketId: string,
    data: {
      content: string;
      attachments?: { fileUrl: string; fileType: string }[];
    },
  ) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('التذكرة غير موجودة');

    return this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        content: data.content,
        attachments: data.attachments?.length
          ? {
              create: data.attachments.map((a) => ({
                fileUrl: a.fileUrl,
                fileType: a.fileType,
              })),
            }
          : undefined,
      },
    });
  }

  async escalateTicketToPolice(ticketId: string) {
    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });
    if (!ticket) throw new NotFoundException('التذكرة غير موجودة');

    await this.prisma.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: 'ESCALATED_TO_POLICE',
        isEscalated: true,
      },
    });

    this.logger.log(
      `Ticket ${ticketId} has been escalated to police in city ${ticket.city || 'Unknown'}`,
    );
    return { message: 'تم تحويل التذكرة إلى قسم الشرطة في المحافظة المعنية.' };
  }

  private async verifyPassword(hash: string, plain: string) {
    try {
      return hash.startsWith('$2a$') || hash.startsWith('$2b$')
        ? await bcrypt.compare(plain, hash)
        : await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  async updateProfile(
    userId: string,
    data: UpdateProfileDto,
    _isAdmin: boolean = false,
    currentJti?: string,
  ) {
    const updateData: Record<string, unknown> = {};
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, password: true },
    });
    if (!current) throw new NotFoundException('المستخدم غير موجود');
    const emailChanged =
      !!data.email &&
      data.email.trim().toLowerCase() !== (current.email ?? '').toLowerCase();
    const sensitiveChange = emailChanged || !!data.password;
    if (sensitiveChange && current.password) {
      const ok =
        !!data.currentPassword &&
        (await this.verifyPassword(current.password, data.currentPassword));
      if (!ok) throw new UnauthorizedException('كلمة السر الحالية غير صحيحة');
    }

    if (data.firstName) {
      const cleanName = sanitize(data.firstName);
      try {
        const moderation = await this.ai.moderateText(cleanName);
        if (!moderation.isSafe) {
          this.logger.warn(
            `Name moderation flagged (fail-open): ${moderation.reason}`,
          );
        }
      } catch (err: any) {
        this.logger.error(
          `AI Name moderation failed (fail-open): ${err?.message}`,
        );
      }
      if (!isValidRealName(cleanName)) {
        throw new BadRequestException('الاسم الأول يبدو غير صالح أو مصطنع');
      }
      updateData.firstName = cleanName;
    }
    if (data.lastName) {
      const cleanName = sanitize(data.lastName);
      try {
        const moderation = await this.ai.moderateText(cleanName);
        if (!moderation.isSafe) {
          this.logger.warn(
            `LastName moderation flagged (fail-open): ${moderation.reason}`,
          );
        }
      } catch (err: any) {
        this.logger.error(
          `AI LastName moderation failed (fail-open): ${err?.message}`,
        );
      }
      if (!isValidRealName(cleanName)) {
        throw new BadRequestException('الكنية تبدو غير صالحة أو مصطنعة');
      }
      updateData.lastName = cleanName;
    }

    if (data.email && emailChanged) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        throw new BadRequestException('البريد الإلكتروني غير صالح');
      }

      const existing = await this.prisma.user.findFirst({
        where: { email: data.email, NOT: { id: userId } },
      });
      if (existing)
        throw new BadRequestException('البريد الإلكتروني مستخدم بالفعل');
      updateData.email = data.email.trim().toLowerCase();
      updateData.isEmailVerified = false;
    }

    if (data.password) {
      if (!current.password) {
        throw new BadRequestException(
          'لا يمكن تعيين كلمة سر من هنا، استخدم "نسيت كلمة السر"',
        );
      }
      const passwordRegex =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
      if (!passwordRegex.test(data.password)) {
        throw new BadRequestException(
          'كلمة السر ضعيفة. يجب أن تحتوي على 8 خانات على الأقل، أحرف كبيرة وصغيرة، رقم، ورمز خاص (@$!%*?&)',
        );
      }
      updateData.password = await argon2.hash(data.password);
    }
    if (data.age !== undefined && data.age !== null) {
      updateData.age =
        typeof data.age === 'number'
          ? data.age
          : parseInt(String(data.age), 10);
    }
    if (data.gender) updateData.gender = data.gender;
    if (data.governorate) updateData.governorate = data.governorate;
    if (data.avatarUrl) updateData.avatarUrl = data.avatarUrl;
    if (data.userType) updateData.userType = data.userType;

    if (data.username) {
      const uname = data.username.trim().toLowerCase();
      const existingUname = await this.prisma.user.findFirst({
        where: { username: uname, NOT: { id: userId } },
        select: { id: true },
      });
      if (existingUname) {
        throw new BadRequestException('اسم المستخدم محجوز، اختر اسماً آخر');
      }
      updateData.username = uname;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isAdmin: true,
        createdAt: true,
      },
    });

    if (sensitiveChange) {
      await this.prisma.loginSession.updateMany({
        where: {
          userId,
          revokedAt: null,
          ...(currentJti ? { NOT: { jti: currentJti } } : {}),
        },
        data: { revokedAt: new Date(), revokeReason: 'credentials_changed' },
      });
    }

    return updatedUser;
  }

  async countSupportTickets() {
    return this.prisma.supportTicket.count({
      where: { status: { not: 'CLOSED' } },
    });
  }

  async findAllSupportTickets() {
    const tickets = await this.prisma.supportTicket.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        messages: { select: { id: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return tickets.map((t) => ({
      ...t,
      user: t.user
        ? {
            ...t.user,
            name:
              [t.user.firstName, t.user.lastName].filter(Boolean).join(' ') ||
              t.user.username ||
              'مستخدم',
          }
        : null,
    }));
  }

  async savePushToken(userId: string, token: string) {
    await this.prisma.user.updateMany({
      where: { expoPushToken: token, NOT: { id: userId } },
      data: { expoPushToken: null },
    });
    return this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: token },
    });
  }

  async deletePushToken(userId: string, token?: string) {
    if (token) {
      return this.prisma.user.updateMany({
        where: { id: userId, expoPushToken: token },
        data: { expoPushToken: null },
      });
    }
    return this.prisma.user.update({
      where: { id: userId },
      data: { expoPushToken: null },
    });
  }

  async getNotificationPreferences(userId: string) {
    let prefs = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!prefs) {
      prefs = await this.prisma.notificationPreference.create({
        data: { userId },
      });
    }
    return prefs;
  }

  async updateNotificationPreferences(userId: string, data: any) {
    const allowedFields = ['messages', 'newListings', 'priceUpdates', 'system'];
    const filteredData: any = {};
    for (const key of allowedFields) {
      if (typeof data[key] === 'boolean') {
        filteredData[key] = data[key];
      }
    }

    return this.prisma.notificationPreference.upsert({
      where: { userId },
      update: filteredData,
      create: { userId, ...filteredData },
    });
  }

  async blockUser(blockerId: string, blockedId: string) {
    if (blockerId === blockedId) {
      throw new BadRequestException('لا يمكنك حظر نفسك');
    }

    const target = await this.prisma.user.findUnique({
      where: { id: blockedId },
    });
    if (!target) throw new NotFoundException('المستخدم غير موجود');

    return this.prisma.userBlock.upsert({
      where: {
        blockerId_blockedId: { blockerId, blockedId },
      },
      create: { blockerId, blockedId },
      update: {},
    });
  }

  async unblockUser(blockerId: string, blockedId: string) {
    try {
      await this.prisma.userBlock.delete({
        where: {
          blockerId_blockedId: { blockerId, blockedId },
        },
      });
    } catch {}
  }

  async getBlockedUsers(userId: string) {
    const blocks = await this.prisma.userBlock.findMany({
      where: { blockerId: userId },
      include: {
        blocked: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
          },
        },
      },
    });

    return blocks.map((b) => ({
      ...b.blocked,
      name:
        [b.blocked.firstName, b.blocked.lastName].filter(Boolean).join(' ') ||
        b.blocked.username ||
        'مستخدم',
    }));
  }
}
