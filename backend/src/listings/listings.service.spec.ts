import { Test, TestingModule } from '@nestjs/testing';
import { ListingsService } from './listings.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { SearchService } from '../search/search.service';
import { AbuseService } from '../abuse/abuse.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ModerationService } from '../moderation/moderation.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

describe('ListingsService', () => {
  let service: ListingsService;
  let prisma: any;
  let redisClient: any;
  let searchService: any;
  let abuseService: any;
  let notificationsService: any;
  let moderationService: any;
  let eventEmitter: any;

  const VALID_UUID = '12345678-1234-4234-8234-123456789012';

  const mockListing = {
    id: VALID_UUID,
    userId: 'user-1',
    title: 'Test Title',
    description: 'Test description',
    price: 1000,
    city: 'DAMASCUS',
    categoryId: 'cat-1',
    status: 'ACTIVE',
    createdAt: new Date(),
    deletedAt: null,
    images: [],
    user: {
      id: 'user-1',
      firstName: 'Ahmad',
      lastName: 'A',
      trustScore: 0,
      createdAt: new Date(),
    },
    category: { id: 'cat-1', slug: 'cars', nameAr: 'سيارات' },
    metadata: {},
  };

  beforeEach(async () => {
    redisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
    };
    prisma = {
      listing: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
        groupBy: jest.fn(),
      },
      user: {
        findUnique: jest.fn().mockResolvedValue({ userType: 'USER' }),
      },
      favorite: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      purchase: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      report: { upsert: jest.fn() },
      supportTicket: { create: jest.fn() },
    };
    searchService = {
      indexListing: jest.fn().mockResolvedValue(undefined),
      removeListing: jest.fn().mockResolvedValue(undefined),
      searchListings: jest.fn(),
      isUnavailable: jest.fn().mockResolvedValue(false),
    };
    abuseService = {
      evaluateListing: jest.fn().mockResolvedValue({ isSafe: true }),
    };
    notificationsService = {
      create: jest.fn().mockResolvedValue(undefined),
    };
    moderationService = {
      moderateText: jest.fn().mockResolvedValue({ status: 'APPROVED' }),
      logDecision: jest.fn().mockResolvedValue(undefined),
    };
    eventEmitter = {
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListingsService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: { client: redisClient } },
        { provide: SearchService, useValue: searchService },
        { provide: AbuseService, useValue: abuseService },
        { provide: NotificationsService, useValue: notificationsService },
        { provide: ModerationService, useValue: moderationService },
        { provide: EventEmitter2, useValue: eventEmitter },
      ],
    }).compile();

    service = module.get<ListingsService>(ListingsService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('create', () => {
    it('should create a listing and index it in ES', async () => {
      prisma.listing.findFirst.mockResolvedValue(null);
      prisma.listing.create.mockResolvedValue(mockListing);

      const result = await service.create(
        {
          title: 'New Car',
          description: 'Great car',
          price: 5000,
          city: 'DAMASCUS',
          categoryId: 'cat-1',
        } as any,
        'user-1',
      );

      expect(result.id).toBe(VALID_UUID);
      expect(prisma.listing.create).toHaveBeenCalled();
      expect(searchService.indexListing).toHaveBeenCalled();
    });

    it('should throw BadRequestException for duplicate listing', async () => {
      prisma.listing.findFirst.mockResolvedValue(mockListing);
      await expect(
        service.create(
          {
            title: 'Test Title',
            description: 'Test description',
          } as any,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for forbidden keywords', async () => {
      moderationService.moderateText.mockResolvedValue({
        status: 'AUTO_REJECTED',
      });
      await expect(
        service.create(
          {
            title: 'بيع مخدرات',
            description: 'Test',
          } as any,
          'user-1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findOne', () => {
    it('should return listing and hide phone', async () => {
      prisma.listing.findUnique.mockResolvedValue(mockListing);

      const result = await service.findOne(VALID_UUID);

      expect(result.id).toBe(VALID_UUID);
      expect(result.user!.name).toBe('Ahmad A');
      expect((result.user as any).phone).toBeUndefined();
    });

    it('should throw NotFoundException for BLOCKED listings', async () => {
      prisma.listing.findUnique.mockResolvedValue({
        ...mockListing,
        status: 'BLOCKED',
      });
      await expect(service.findOne(VALID_UUID)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update listing and re-index', async () => {
      prisma.listing.findUnique.mockResolvedValue(mockListing);
      prisma.listing.update.mockResolvedValue({
        ...mockListing,
        title: 'Updated',
      });

      const result = await service.update(
        VALID_UUID,
        { title: 'Updated' },
        'user-1',
      );

      expect(result.title).toBe('Updated');
      expect(searchService.indexListing).toHaveBeenCalled();
      expect(eventEmitter.emit).toHaveBeenCalledWith(
        'listing.updated',
        expect.any(Object),
      );
    });

    it('should throw ForbiddenException if user is not owner', async () => {
      prisma.listing.findUnique.mockResolvedValue(mockListing);
      await expect(
        service.update(VALID_UUID, { title: 'Updated' }, 'wrong-user'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('remove', () => {
    it('should soft-delete and remove from ES', async () => {
      prisma.listing.findUnique.mockResolvedValue(mockListing);
      prisma.listing.update.mockResolvedValue({
        ...mockListing,
        status: 'DELETED',
      });

      const result = await service.remove(VALID_UUID, 'user-1', false);

      expect(result.success).toBe(true);
      expect(prisma.listing.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ status: 'DELETED' }),
        }),
      );
      expect(searchService.removeListing).toHaveBeenCalled();
    });
  });

  describe('toggleFavorite', () => {
    it('should toggle favorite status', async () => {
      prisma.favorite.findUnique.mockResolvedValue(null);
      prisma.favorite.create.mockResolvedValue({});

      let result = await service.toggleFavorite('listing-1', 'user-1');
      expect(result.favorited).toBe(true);

      prisma.favorite.findUnique.mockResolvedValue({
        userId: 'u',
        listingId: 'l',
      });
      result = await service.toggleFavorite('listing-1', 'user-1');
      expect(result.favorited).toBe(false);
    });
  });
});
