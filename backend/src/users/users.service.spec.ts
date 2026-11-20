import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { NotFoundException } from '@nestjs/common';

import { AIService } from '../ai/ai.service';
import { ChatGateway } from '../chat/chat.gateway';

describe('UsersService', () => {
  let service: UsersService;
  let prisma: any;
  let search: any;

  const VALID_UUID = '12345678-1234-4234-8234-123456789012';

  beforeEach(async () => {
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
      listing: {
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
      report: { deleteMany: jest.fn() },
      favorite: { deleteMany: jest.fn() },
      supportTicket: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
      $transaction: jest.fn().mockResolvedValue([]),
    };
    search = {
      removeListing: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: PrismaService, useValue: prisma },
        { provide: SearchService, useValue: search },
        { provide: AIService, useValue: { moderateText: jest.fn() } },
        { provide: ChatGateway, useValue: { emitToAdmins: jest.fn() } },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('getMe', () => {
    it('should return user with avatarUrl, _count and identity fields', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: VALID_UUID,
        name: 'Test',
        avatarUrl: 'https://example.com/avatar.png',
        trustScore: 0,
        isAdmin: false,
        _count: { listings: 0, favorites: 0 },
      });

      const result = await service.getMe(VALID_UUID);

      expect(result.avatarUrl).toBe('https://example.com/avatar.png');
      expect(result._count).toEqual({ listings: 0, favorites: 0 });
    });

    it('should throw NotFoundException when user missing', async () => {
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(service.getMe(VALID_UUID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteAccount (Google Play compliance)', () => {
    it('should anonymize user (not hard delete) to preserve chats', async () => {
      prisma.listing.findMany.mockResolvedValue([{ id: 'l1' }, { id: 'l2' }]);

      await service.deleteAccount(VALID_UUID);

      expect(prisma.$transaction).toHaveBeenCalled();
      const transactionCalls = prisma.user.update.mock.calls;
      const anonymizeCall = transactionCalls.find(
        (c: any[]) => c[0].data?.isDeleted === true,
      );
      expect(anonymizeCall).toBeDefined();
      expect(anonymizeCall[0].data.firstName).toBe('مستخدم');
      expect(anonymizeCall[0].data.lastName).toBe('محذوف');
      expect(anonymizeCall[0].data.email).toBeNull();
    });

    it('should attempt ES cleanup for all user listings', async () => {
      prisma.listing.findMany.mockResolvedValue([{ id: 'l1' }, { id: 'l2' }]);

      await service.deleteAccount(VALID_UUID);

      expect(search.removeListing).toHaveBeenCalledWith('l1');
      expect(search.removeListing).toHaveBeenCalledWith('l2');
    });

    it('should not throw when ES is unavailable (best-effort cleanup)', async () => {
      prisma.listing.findMany.mockResolvedValue([{ id: 'l1' }]);
      search.removeListing.mockRejectedValue(new Error('ES down'));

      await expect(service.deleteAccount(VALID_UUID)).resolves.toBeUndefined();
    });

    it('should handle empty account (no listings)', async () => {
      prisma.listing.findMany.mockResolvedValue([]);
      await expect(service.deleteAccount(VALID_UUID)).resolves.toBeUndefined();
      expect(search.removeListing).not.toHaveBeenCalled();
    });
  });

  describe('countAll', () => {
    it('should exclude soft-deleted users', async () => {
      prisma.user.count.mockResolvedValue(42);
      await service.countAll();
      expect(prisma.user.count).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
    });
  });
});
