import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Request,
  UseGuards,
  BadRequestException,
  Logger,
} from '@nestjs/common';

import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/auth.types';
import { ChatService } from './chat.service';

const MIN_MESSAGE_LEN = 1;
const MAX_MESSAGE_LEN = 2000;

interface ChatRow {
  id: string;
  userAId: string;
  userBId: string;
  userA: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  userB: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    avatarUrl: string | null;
  };
  listing: { id: string; title: string; images: { thumbUrl: string }[] } | null;
  messages: {
    content: string;
    createdAt: Date;
    senderId: string;
  }[];
  lastMessageAt: Date;
}

@Controller('chats')
@UseGuards(JwtAuthGuard)
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Get()
  async myChats(
    @Request() req: AuthRequest,
    @Query('archived') archived?: string,
  ) {
    const userId = req.user.sub;
    const isArchived = archived === 'true';
    this.logger.log(
      `Fetching chats for user: ${userId}, archived: ${isArchived}`,
    );
    try {
      const chats = (await this.chatService.getUserChats(
        userId,
        isArchived,
      )) as ChatRow[];
      this.logger.log(`Found ${chats.length} chats for user ${userId}`);

      return chats.map((c) => {
        try {
          const other = c.userAId === userId ? c.userB : c.userA;
          if (!other) {
            this.logger.error(
              `Chat ${c.id} is missing 'other' user data. userAId: ${c.userAId}, userBId: ${c.userBId}, current userId: ${userId}`,
            );
            throw new Error(
              `Data integrity error: missing user relation in chat ${c.id}`,
            );
          }
          const last = c.messages?.[0];
          return {
            id: c.id,
            otherUser: {
              id: other.id,
              name:
                [other.firstName, other.lastName].filter(Boolean).join(' ') ||
                (other as any).username ||
                'مستخدم',
              avatarUrl: other.avatarUrl,
            },
            listing: c.listing
              ? {
                  id: c.listing.id,
                  title: c.listing.title,
                  image: c.listing.images?.[0]?.thumbUrl,
                }
              : null,
            lastMessage: last
              ? {
                  content: last.content,
                  createdAt: last.createdAt,
                  senderId: last.senderId,
                }
              : null,
            unreadCount: 0,
            lastMessageAt: c.lastMessageAt,
          };
        } catch (e) {
          this.logger.error(`Error mapping chat ${c.id}: ${e.message}`);
          throw e;
        }
      });
    } catch (error) {
      this.logger.error(
        `Failed to get user chats for ${userId}: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  @Get(':otherUserId')
  async history(
    @Request() req: AuthRequest,
    @Param('otherUserId') otherUserId: string,
    @Query('listingId') listingId?: string,
  ) {
    const userId = req.user.sub;
    if (otherUserId === userId) {
      throw new BadRequestException('لا يمكن فتح محادثة مع نفسك');
    }
    const chat = await this.chatService.getChatHistory(
      userId,
      otherUserId,
      listingId,
    );
    return chat ?? { messages: [] };
  }

  @Post(':otherUserId/messages')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async send(
    @Request() req: AuthRequest,
    @Param('otherUserId') otherUserId: string,
    @Body('content') content: string,
    @Body('listingId') listingId?: string,
  ) {
    const userId = req.user.sub;
    if (otherUserId === userId) {
      throw new BadRequestException('لا يمكن إرسال رسالة لنفسك');
    }
    const trimmed = (content ?? '').trim();
    if (trimmed.length < MIN_MESSAGE_LEN || trimmed.length > MAX_MESSAGE_LEN) {
      throw new BadRequestException(
        `الرسالة يجب أن تكون بين ${MIN_MESSAGE_LEN} و ${MAX_MESSAGE_LEN} حرف`,
      );
    }
    return this.chatService.createMessage(
      userId,
      otherUserId,
      trimmed,
      listingId,
    );
  }

  @Post(':chatId/read')
  async markRead(@Request() req: AuthRequest, @Param('chatId') chatId: string) {
    const userId = req.user.sub;
    return this.chatService.markAsRead(chatId, userId);
  }

  @Post('messages/:messageId/delete-for-me')
  async deleteMessage(
    @Request() req: AuthRequest,
    @Param('messageId') messageId: string,
  ) {
    const userId = req.user.sub;
    return this.chatService.deleteMessageForUser(messageId, userId);
  }

  @Post(':chatId/archive')
  async archiveChat(
    @Request() req: AuthRequest,
    @Param('chatId') chatId: string,
  ) {
    const userId = req.user.sub;
    return this.chatService.toggleArchive(chatId, userId, true);
  }

  @Post(':chatId/unarchive')
  async unarchiveChat(
    @Request() req: AuthRequest,
    @Param('chatId') chatId: string,
  ) {
    const userId = req.user.sub;
    return this.chatService.toggleArchive(chatId, userId, false);
  }
}
