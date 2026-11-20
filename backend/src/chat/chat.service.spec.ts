import { Test, TestingModule } from '@nestjs/testing';
import { ChatService } from './chat.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ModerationService } from '../moderation/moderation.service';
import { AIService } from '../ai/ai.service';

describe('ChatService', () => {
  let service: ChatService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      userBlock: { findFirst: jest.fn(), findMany: jest.fn() },
      user: { findUnique: jest.fn(), findMany: jest.fn() },
      chat: {
        upsert: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      message: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        { provide: PrismaService, useValue: prisma },
        { provide: NotificationsService, useValue: { create: jest.fn() } },
        {
          provide: ModerationService,
          useValue: {
            staticCheck: jest.fn().mockReturnValue({ status: 'APPROVED' }),
            logDecision: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AIService,
          useValue: {
            moderateText: jest.fn().mockResolvedValue({ isSafe: true }),
          },
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('createMessage', () => {
    it('should sort user IDs alphabetically and create chat', async () => {
      prisma.chat.findFirst.mockResolvedValue(null);
      prisma.chat.create.mockResolvedValue({ id: 'chat-1' });
      prisma.$transaction.mockResolvedValue([
        { id: 'msg-1', chatId: 'chat-1', senderId: 'b-user', content: 'hi' },
        { id: 'chat-1' },
      ]);

      const msg = await service.createMessage('b-user', 'a-user', 'hi');

      expect(prisma.chat.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userAId: 'a-user', userBId: 'b-user', listingId: null },
        }),
      );
      expect(prisma.chat.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { userAId: 'a-user', userBId: 'b-user', listingId: null },
        }),
      );
      expect(msg.id).toBe('msg-1');
    });

    it('should reuse existing chat when one exists', async () => {
      prisma.chat.findFirst.mockResolvedValue({ id: 'existing-chat' });
      prisma.$transaction.mockResolvedValue([
        {
          id: 'msg-2',
          chatId: 'existing-chat',
          senderId: 'u1',
          content: 'hello',
        },
        { id: 'existing-chat' },
      ]);

      await service.createMessage('u1', 'u2', 'hello');

      expect(prisma.chat.findFirst).toHaveBeenCalledTimes(1);
      expect(prisma.chat.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserChats', () => {
    it('should query chats for both userA and userB sides', async () => {
      prisma.userBlock.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.chat.findMany.mockResolvedValue([]);
      await service.getUserChats('user-x');

      expect(prisma.chat.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            AND: expect.arrayContaining([
              {
                OR: [
                  { userAId: 'user-x', isArchivedByA: false },
                  { userBId: 'user-x', isArchivedByB: false },
                ],
              },
            ]),
          }),
        }),
      );
    });

    it('should return empty array when user has no chats', async () => {
      prisma.userBlock.findMany.mockResolvedValue([]);
      prisma.user.findMany.mockResolvedValue([]);
      prisma.chat.findMany.mockResolvedValue([]);
      const result = await service.getUserChats('user-x');
      expect(result).toEqual([]);
    });
  });

  describe('getChatHistory', () => {
    it('should look up chat using sorted user IDs', async () => {
      prisma.chat.findFirst.mockResolvedValue(null);
      await service.getChatHistory('zeta', 'alpha');

      expect(prisma.chat.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userAId: 'alpha', userBId: 'zeta', listingId: null },
        }),
      );
    });
  });
});
