import {
  Injectable,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, ModerationStatus } from '@prisma/client';
import { ModerationService } from '../moderation/moderation.service';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private moderation: ModerationService,
    private ai: AIService,
  ) {}

  async createMessage(
    senderId: string,
    receiverId: string,
    content: string,
    listingId?: string,
  ) {
    const moderation = this.moderation.staticCheck(content);
    if (moderation.status === ModerationStatus.AUTO_REJECTED) {
      this.logger.warn(
        `Blocked message from ${senderId} to ${receiverId}: ${moderation.reason}`,
      );
      throw new BadRequestException(
        moderation.reason ||
          'لا يمكن إرسال هذه الرسالة بسبب مخالفة شروط المحتوى.',
      );
    }
    if (moderation.status === ModerationStatus.FLAGGED) {
      this.moderation
        .logDecision({
          userId: senderId,
          decision: ModerationStatus.FLAGGED,
          reason: moderation.reason,
          source: 'static',
        })
        .catch(() => {});
    }

    const shouldRunAI = content.trim().length >= 3;
    const [isBlocked, aiResult] = await Promise.all([
      this.prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: senderId, blockedId: receiverId },
            { blockerId: receiverId, blockedId: senderId },
          ],
        },
      }),
      shouldRunAI
        ? this.ai.moderateText(content).catch(() => ({ isSafe: true as const }))
        : Promise.resolve({ isSafe: true as const }),
    ]);

    if (!aiResult.isSafe) {
      const reason = aiResult.reason;
      this.logger.warn(
        `AI blocked message from ${senderId} to ${receiverId}: ${reason || 'unsafe content'}`,
      );
      this.moderation
        .logDecision({
          userId: senderId,
          decision: ModerationStatus.AUTO_REJECTED,
          reason: reason || 'AI moderation rejected',
          source: 'ai',
        })
        .catch(() => {});
      throw new BadRequestException(
        reason || 'لا يمكن إرسال هذه الرسالة بسبب مخالفة شروط المحتوى.',
      );
    }

    if (isBlocked) {
      throw new ForbiddenException(
        'لا يمكن إرسال الرسالة، أحد الطرفين قام بحظر الآخر',
      );
    }

    const sender = await this.prisma.user.findUnique({
      where: { id: senderId },
    });

    const [userAId, userBId] = [senderId, receiverId].sort();
    const lId = listingId || null;

    let chat = await this.prisma.chat.findFirst({
      where: { userAId, userBId, listingId: lId },
    });
    if (!chat) {
      chat = await this.prisma.chat.create({
        data: { userAId, userBId, listingId: lId },
      });
    }

    const [message] = await this.prisma.$transaction([
      this.prisma.message.create({
        data: {
          chatId: chat.id,
          senderId,
          content,
          listingId: lId,
        },
        include: {
          sender: { select: { id: true, firstName: true, avatarUrl: true } },
        },
      }),
      this.prisma.chat.update({
        where: { id: chat.id },
        data: { lastMessageAt: new Date() },
      }),
    ]);

    if (!sender?.isBlocked) {
      await this.notifications.create({
        userId: receiverId,
        title: `رسالة جديدة من ${sender?.firstName || 'مستخدم'}`,
        body: content.length > 50 ? `${content.substring(0, 50)}...` : content,
        type: NotificationType.MESSAGE,
        referenceId: chat.id,
      });
    }

    return message;
  }

  async getUserChats(userId: string, isArchived: boolean = false, limit = 30) {
    const blocks = await this.prisma.userBlock.findMany({
      where: {
        OR: [{ blockerId: userId }, { blockedId: userId }],
      },
      select: { blockerId: true, blockedId: true },
    });

    const globalBlocks = await this.prisma.user.findMany({
      where: { isBlocked: true },
      select: { id: true },
    });
    const globallyBlockedIds = globalBlocks.map((u) => u.id);

    const excludedIds = Array.from(
      new Set([
        ...blocks.flatMap((b) => [b.blockerId, b.blockedId]),
        ...globallyBlockedIds,
      ]),
    ).filter((id) => id !== userId);

    try {
      return await this.prisma.chat.findMany({
        where: {
          AND: [
            {
              OR: [
                { userAId: userId, isArchivedByA: isArchived },
                { userBId: userId, isArchivedByB: isArchived },
              ],
            },
            { userAId: { notIn: excludedIds } },
            { userBId: { notIn: excludedIds } },
          ],
        },
        include: {
          userA: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
            },
          },
          userB: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              username: true,
              avatarUrl: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              images: { take: 1, select: { thumbUrl: true } },
            },
          },
          messages: {
            where: {
              OR: [
                { senderId: userId, deletedForSender: false },
                { senderId: { not: userId }, deletedForReceiver: false },
              ],
            },
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { lastMessageAt: 'desc' },
        take: limit,
      });
    } catch (e) {
      this.logger.error(
        `Database error in getUserChats: ${e.message}`,
        e.stack,
      );
      throw e;
    }
  }

  async getChatHistory(
    userId: string,
    otherUserId: string,
    listingId?: string,
  ) {
    const [userAId, userBId] = [userId, otherUserId].sort();
    const lId = listingId || null;

    return this.prisma.chat.findFirst({
      where: { userAId, userBId, listingId: lId },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            images: { take: 1, select: { thumbUrl: true } },
          },
        },
        messages: {
          where: {
            OR: [
              { senderId: userId, deletedForSender: false },
              { senderId: { not: userId }, deletedForReceiver: false },
            ],
          },
          orderBy: { createdAt: 'asc' },
          take: 100,
        },
      },
    });
  }

  async markAsRead(chatId: string, userId: string) {
    const readAt = new Date();
    const result = await this.prisma.message.updateMany({
      where: {
        chatId,
        senderId: { not: userId },
        readAt: null,
      },
      data: {
        readAt,
      },
    });
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      select: { userAId: true, userBId: true },
    });
    const otherUserId = chat
      ? chat.userAId === userId
        ? chat.userBId
        : chat.userAId
      : null;
    return { count: result.count, readAt, otherUserId };
  }

  async deleteMessageForUser(messageId: string, userId: string) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      include: { chat: true },
    });
    if (!msg) throw new BadRequestException('Message not found');

    if (msg.senderId === userId) {
      return this.prisma.message.update({
        where: { id: messageId },
        data: { deletedForSender: true },
      });
    } else if (msg.chat.userAId === userId || msg.chat.userBId === userId) {
      return this.prisma.message.update({
        where: { id: messageId },
        data: { deletedForReceiver: true },
      });
    } else {
      throw new ForbiddenException('Not authorized to delete this message');
    }
  }

  async toggleArchive(chatId: string, userId: string, isArchived: boolean) {
    const chat = await this.prisma.chat.findUnique({ where: { id: chatId } });
    if (!chat) throw new BadRequestException('Chat not found');

    if (chat.userAId === userId) {
      return this.prisma.chat.update({
        where: { id: chatId },
        data: { isArchivedByA: isArchived },
      });
    } else if (chat.userBId === userId) {
      return this.prisma.chat.update({
        where: { id: chatId },
        data: { isArchivedByB: isArchived },
      });
    } else {
      throw new ForbiddenException('Not authorized to archive this chat');
    }
  }
}
