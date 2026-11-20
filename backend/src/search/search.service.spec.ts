import { Test, TestingModule } from '@nestjs/testing';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { SearchService } from './search.service';
import { PrismaService } from '../prisma/prisma.service';

describe('SearchService', () => {
  let service: SearchService;
  let esService: any;
  let prisma: any;

  beforeEach(async () => {
    esService = {
      ping: jest.fn().mockResolvedValue(true),
      indices: {
        exists: jest.fn().mockResolvedValue(true),
        create: jest.fn().mockResolvedValue(undefined),
      },
      index: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      search: jest.fn(),
    };
    prisma = {};

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        { provide: ElasticsearchService, useValue: esService },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  afterEach(() => jest.clearAllMocks());

  describe('onModuleInit / availability', () => {
    it('should mark ES as available when index check succeeds', async () => {
      await service.onModuleInit();
      expect(service.isUnavailable()).toBe(false);
    });

    it('should create index when it does not exist', async () => {
      esService.indices.exists.mockResolvedValueOnce(false);
      await service.onModuleInit();
      expect(esService.indices.create).toHaveBeenCalled();
    });

    it('should mark ES unavailable when ES throws on init', async () => {
      esService.indices.exists.mockRejectedValueOnce(
        new Error('connection refused'),
      );
      await service.onModuleInit();
      expect(service.isUnavailable()).toBe(true);
    });
  });

  describe('searchListings', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should return items + nextCursor=null when fewer than size', async () => {
      esService.search.mockResolvedValue({
        hits: {
          hits: [
            { _source: { id: '1', createdAt: '2026-01-01' } },
            { _source: { id: '2', createdAt: '2026-01-02' } },
          ],
        },
      });

      const result = await service.searchListings(
        'test',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        20,
      );

      expect(result.items).toHaveLength(2);
      expect(result.nextCursor).toBeNull();
    });

    it('should set nextCursor when items === size (more pages possible)', async () => {
      const hits = Array.from({ length: 3 }, (_, i) => ({
        _source: { id: `${i}`, createdAt: `2026-01-0${i + 1}` },
      }));
      esService.search.mockResolvedValue({ hits: { hits } });

      const result = await service.searchListings(
        'q',
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        3,
      );

      expect(result.nextCursor).toBe('2026-01-03');
    });

    it('should fall back to empty result when ES throws', async () => {
      esService.search.mockRejectedValue(new Error('cluster down'));

      const result = await service.searchListings('q');

      expect(result).toEqual({ items: [], nextCursor: null });
      expect(service.isUnavailable()).toBe(true);
    });

    it('should pass city filter to ES query', async () => {
      esService.search.mockResolvedValue({ hits: { hits: [] } });
      await service.searchListings('q', 'DAMASCUS');

      const body = esService.search.mock.calls[0][0];
      expect(body.query.bool.filter).toEqual(
        expect.arrayContaining([{ term: { city: 'DAMASCUS' } }]),
      );
    });

    it('should pass price range filter when min/max provided', async () => {
      esService.search.mockResolvedValue({ hits: { hits: [] } });
      await service.searchListings('q', undefined, undefined, 100, 500);

      const body = esService.search.mock.calls[0][0];
      expect(body.query.bool.filter).toEqual(
        expect.arrayContaining([{ range: { price: { gte: 100, lte: 500 } } }]),
      );
    });
  });

  describe('indexListing / removeListing', () => {
    beforeEach(async () => {
      await service.onModuleInit();
    });

    it('should index a listing with refresh=wait_for', async () => {
      const listing: Parameters<typeof service.indexListing>[0] = {
        id: 'l1',
        title: 't',
        description: 'd',
        price: 100,
        city: 'DAMASCUS',
        categoryId: 'c',
        status: 'ACTIVE',
        createdAt: new Date(),
        userId: 'u1',
      };

      await service.indexListing(listing);

      expect(esService.index).toHaveBeenCalledWith(
        expect.objectContaining({
          index: 'listings',
          id: 'l1',
          refresh: 'wait_for',
        }),
      );
    });

    it('should swallow 404 on remove (idempotent delete)', async () => {
      esService.delete.mockRejectedValueOnce({ meta: { statusCode: 404 } });
      await expect(service.removeListing('missing')).resolves.toBeUndefined();
    });
  });
});
