import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../redis/redis.service';
import { JwtPayload } from '../auth/auth.types';
import { SessionsService } from '../auth/sessions.service';
import { PrismaService } from '../prisma/prisma.service';
import { createAdapter } from '@socket.io/redis-adapter';
import { Logger } from '@nestjs/common';

const ACTIVE_USER_TTL_SEC = 60 * 60 * 12;

interface CustomSocket extends Socket {
  data: {
    user?: JwtPayload;
  };
}

@WebSocketGateway({
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);

  constructor(
    private readonly chatService: ChatService,
    private readonly jwtService: JwtService,
    private readonly redis: RedisService,
    private readonly sessionsService: SessionsService,
    private readonly prisma: PrismaService,
  ) {}

  private userSocketKey(userId: string) {
    return `ws:user:${userId}`;
  }

  afterInit(server: Server) {
    try {
      if (this.redis.pubClient && this.redis.subClient) {
        server.adapter(
          createAdapter(this.redis.pubClient, this.redis.subClient),
        );
        this.logger.log(
          'Socket.IO Redis adapter attached — multi-instance ready',
        );
      } else {
        this.logger.warn(
          'Redis clients not available — running in single-instance mode',
        );
      }
    } catch (e) {
      this.logger.error(
        'Failed to attach Redis adapter, running in memory:',
        e,
      );
    }
  }

  async handleConnection(client: CustomSocket) {
    try {
      const authToken = (client.handshake.auth as { token?: string })?.token;
      const headerToken = client.handshake.headers.authorization?.split(' ')[1];
      const token = authToken || headerToken;
      if (!token) throw new Error('No token provided');

      const payload = await this.jwtService.verifyAsync<JwtPayload>(token);
      const userId = payload.sub;

      if (!payload.jti) throw new Error('Token has no session id');
      const session = await this.sessionsService.findActiveByJti(payload.jti);
      if (!session) throw new Error('Session revoked');

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { isBlocked: true, isDeleted: true },
      });
      if (!user || user.isDeleted || user.isBlocked)
        throw new Error('Account disabled');

      await this.redis.client.set(
        this.userSocketKey(userId),
        client.id,
        'EX',
        ACTIVE_USER_TTL_SEC,
      );

      client.data.user = payload;
      await client.join(`user:${userId}`);

      if (payload.isAdmin) {
        await client.join('admin');
        this.logger.log(`Admin ${userId} joined admin room`);
      }

      this.logger.log(`User ${userId} connected (socket ${client.id})`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.warn(`WS Connection Rejected: ${msg}`);
      client.disconnect(true);
    }
  }

  async handleDisconnect(client: CustomSocket) {
    const user = client.data.user;
    const userId = user?.sub;
    if (!userId) return;

    const stored = await this.redis.client.get(this.userSocketKey(userId));
    if (stored === client.id) {
      await this.redis.client.del(this.userSocketKey(userId));
    }
    this.logger.log(`User ${userId} disconnected (socket ${client.id})`);
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @MessageBody()
    payload: { receiverId: string; content: string; listingId?: string },
    @ConnectedSocket() client: CustomSocket,
  ) {
    const user = client.data.user;
    const senderId = user?.sub;
    if (!senderId) return { error: 'Unauthorized' };

    const content = (payload?.content ?? '').trim();
    if (!payload?.receiverId || content.length === 0 || content.length > 2000) {
      return { error: 'Invalid message' };
    }

    try {
      const message = await this.chatService.createMessage(
        senderId,
        payload.receiverId,
        content,
        payload.listingId,
      );

      this.server.to(`user:${payload.receiverId}`).emit('new_message', message);

      this.server.to(`user:${senderId}`).emit('new_message', message);

      return { event: 'message_sent', data: message };
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'فشل إرسال الرسالة';
      this.logger.error(`Failed to send message: ${msg}`);
      return { error: msg };
    }
  }

  @SubscribeMessage('mark_read')
  async handleMarkRead(
    @MessageBody() payload: { chatId: string },
    @ConnectedSocket() client: CustomSocket,
  ) {
    const userId = client.data.user?.sub;
    if (!userId || !payload?.chatId) return;

    try {
      const { readAt, otherUserId } = await this.chatService.markAsRead(
        payload.chatId,
        userId,
      );
      if (otherUserId) {
        this.server.to(`user:${otherUserId}`).emit('messages_read', {
          chatId: payload.chatId,
          readerId: userId,
          readAt,
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      this.logger.error(`mark_read failed: ${msg}`);
    }
  }

  @SubscribeMessage('typing')
  handleTyping(
    @MessageBody()
    payload: { receiverId: string; chatId: string; listingId?: string },
    @ConnectedSocket() client: CustomSocket,
  ) {
    const user = client.data.user;
    if (!user?.sub) return;

    this.server.to(`user:${payload.receiverId}`).emit('typing', {
      senderId: user.sub,
      chatId: payload.chatId,
      listingId: payload.listingId,
    });
  }

  @SubscribeMessage('stop_typing')
  handleStopTyping(
    @MessageBody()
    payload: { receiverId: string; chatId: string; listingId?: string },
    @ConnectedSocket() client: CustomSocket,
  ) {
    const user = client.data.user;
    if (!user?.sub) return;

    this.server.to(`user:${payload.receiverId}`).emit('stop_typing', {
      senderId: user.sub,
      chatId: payload.chatId,
      listingId: payload.listingId,
    });
  }

  emitToAdmins(event: string, data: any) {
    this.server.to('admin').emit(event, data);
  }
}
