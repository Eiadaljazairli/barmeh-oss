import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from '../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';

export interface IndexableListing {
  id: string;
  userId: string;
  title: string;
  description: string;
  price: number;
  city: string;
  categoryId: string;
  status?: string;
  priceStatus?: string;
  moderationStatus?: string;
  createdAt: Date | string;
  latitude?: number;
  longitude?: number;
}

export interface SearchHit<T> {
  _source: T;
}

@Injectable()
export class SearchService implements OnModuleInit {
  private readonly logger = new Logger(SearchService.name);
  private readonly indexName = 'listings';
  private esAvailable = false;

  constructor(
    private readonly esService: ElasticsearchService,
    private readonly prisma: PrismaService,
  ) {}

  async onModuleInit() {
    try {
      await this.esService.ping();
      this.esAvailable = true;
      await this.createIndex();
    } catch (error: any) {
      this.esAvailable = false;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Elasticsearch is down (${msg}). Falling back to Postgres.`,
      );
    }
  }

  isUnavailable(): boolean {
    return !this.esAvailable;
  }

  private async createIndex() {
    try {
      const indexExists = await this.esService.indices.exists({
        index: this.indexName,
      });
      this.esAvailable = true;
      if (!indexExists) {
        await this.esService.indices.create({
          index: this.indexName,
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            analysis: {
              analyzer: {
                arabic_analyzer: {
                  type: 'custom',
                  tokenizer: 'standard',
                  filter: [
                    'lowercase',
                    'arabic_normalization',
                    'arabic',
                    'arabic_stemmer',
                  ],
                },
              },
            },
          },
          mappings: {
            properties: {
              id: { type: 'keyword' },
              userId: { type: 'keyword' },
              title: { type: 'text', analyzer: 'arabic_analyzer' },
              description: { type: 'text', analyzer: 'arabic_analyzer' },
              price: { type: 'float' },
              city: { type: 'keyword' },
              categoryId: { type: 'keyword' },
              status: { type: 'keyword' },
              moderationStatus: { type: 'keyword' },
              priceStatus: { type: 'keyword' },
              createdAt: { type: 'date' },
              location: { type: 'geo_point' },
            },
          },
        });
        this.logger.log(`Created Elasticsearch index: ${this.indexName}`);
      }
    } catch (error: any) {
      this.esAvailable = false;
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.warn(
        `Elasticsearch unavailable (${msg}). Falling back to Postgres for searches.`,
      );
    }
  }

  async indexListing(listing: IndexableListing) {
    if (!this.esAvailable) return;
    await this.esService.index({
      index: this.indexName,
      id: listing.id,
      refresh: 'wait_for',
      document: {
        id: listing.id,
        userId: listing.userId,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        city: listing.city,
        categoryId: listing.categoryId,
        status: listing.status ?? 'ACTIVE',
        moderationStatus: listing.moderationStatus ?? 'APPROVED',
        priceStatus: listing.priceStatus,
        createdAt: listing.createdAt,
        location:
          listing.latitude != null && listing.longitude != null
            ? { lat: listing.latitude, lon: listing.longitude }
            : undefined,
      },
    });
  }

  async indexListingAsync(listingId: string) {
    if (!this.esAvailable) return;
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      include: { category: true },
    });
    if (!listing) return;

    await this.indexListing({
      id: listing.id,
      userId: listing.userId,
      title: listing.title,
      description: listing.description,
      price: listing.price,
      city: listing.city,
      categoryId: listing.categoryId,
      status: listing.status,
      moderationStatus: listing.moderationStatus,
      priceStatus: listing.priceStatus,
      createdAt: listing.createdAt,
      latitude: listing.latitude ?? undefined,
      longitude: listing.longitude ?? undefined,
    });
  }

  async deleteFromIndex(listingId: string) {
    return this.removeListing(listingId);
  }

  async removeListing(listingId: string) {
    if (!this.esAvailable) return;
    try {
      await this.esService.delete({ index: this.indexName, id: listingId });
    } catch (e) {
      if (e?.meta?.statusCode !== 404) {
        const msg = e instanceof Error ? e.message : String(e);
        this.logger.warn(
          `Failed to remove listing ${listingId} from ES: ${msg}`,
        );
      }
    }
  }

  @OnEvent('user.shadow_banned')
  async handleUserShadowBanned(userId: string) {
    if (!this.esAvailable) return;
    try {
      this.logger.log(
        `Removing all active listings for shadow banned user: ${userId}`,
      );
      await this.esService.deleteByQuery({
        index: this.indexName,
        query: {
          term: { userId: userId },
        },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.error(
        `Failed to remove listings for banned user ${userId} from ES: ${msg}`,
      );
    }
  }

  async reindexAllListings() {
    if (!this.esAvailable) return;
    this.logger.log('Reindexing all listings...');
    const listings = await this.prisma.listing.findMany({
      where: { status: 'ACTIVE', moderationStatus: 'APPROVED' },
    });

    for (const listing of listings) {
      await this.indexListing({
        id: listing.id,
        userId: listing.userId,
        title: listing.title,
        description: listing.description,
        price: listing.price,
        city: listing.city,
        categoryId: listing.categoryId,
        status: listing.status,
        moderationStatus: listing.moderationStatus,
        priceStatus: listing.priceStatus,
        createdAt: listing.createdAt,
        latitude: listing.latitude ?? undefined,
        longitude: listing.longitude ?? undefined,
      });
    }
    this.logger.log(`Reindexed ${listings.length} listings`);
  }

  async searchListings(
    query: string,
    city?: string,
    categoryId?: string,
    minPrice?: number,
    maxPrice?: number,
    cursor?: string,
    lat?: number,
    lng?: number,
    distance?: number,
    priceStatus?: string,
    size = 20,
    excludedUserIds: string[] = [],
  ) {
    if (!this.esAvailable) {
      return { items: [], nextCursor: null };
    }

    const must: any[] = [];

    if (query?.trim()) {
      must.push({
        multi_match: {
          query: query.trim(),
          fields: ['title^3', 'description'],
          fuzziness: 'AUTO',
        },
      });
    } else {
      must.push({ match_all: {} });
    }

    const filter: any[] = [
      { term: { status: 'ACTIVE' } },
      { term: { moderationStatus: 'APPROVED' } },
    ];
    if (excludedUserIds.length > 0) {
      filter.push({
        bool: { must_not: { terms: { userId: excludedUserIds } } },
      });
    }
    if (city) filter.push({ term: { city } });
    if (categoryId) filter.push({ term: { categoryId } });
    if (priceStatus)
      filter.push({ term: { priceStatus: priceStatus.toUpperCase() } });

    if (minPrice != null || maxPrice != null) {
      filter.push({
        range: {
          price: {
            ...(minPrice != null && { gte: minPrice }),
            ...(maxPrice != null && { lte: maxPrice }),
          },
        },
      });
    }
    if (lat != null && lng != null && distance != null) {
      filter.push({
        geo_distance: {
          distance: `${distance}km`,
          location: { lat, lon: lng },
        },
      });
    }

    if (cursor) {
      filter.push({ range: { createdAt: { lt: cursor } } });
    }

    let result: any;
    try {
      result = await this.esService.search({
        index: this.indexName,
        query: { bool: { must, filter } },
        sort: [
          ...(lat != null && lng != null
            ? [
                {
                  _geo_distance: {
                    location: { lat, lon: lng },
                    order: 'asc' as const,
                    unit: 'km' as const,
                    mode: 'min' as const,
                    distance_type: 'arc' as const,
                    ignore_unmapped: true,
                  },
                },
              ]
            : []),
          { _score: { order: 'desc' as const } },
          { createdAt: { order: 'desc' as const } },
        ],
        size,
      });
    } catch (e) {
      this.esAvailable = false;
      const msg = e instanceof Error ? e.message : String(e);
      this.logger.warn(`ES search failed: ${msg}`);
      return { items: [], nextCursor: null };
    }

    const hits = result.hits.hits as SearchHit<IndexableListing>[];
    const items = hits.map((h) => h._source);
    const nextCursor =
      items.length === size ? (items[items.length - 1] as any).createdAt : null;

    return { items, nextCursor };
  }

  async autocomplete(query: string, size = 5): Promise<string[]> {
    if (!this.esAvailable || !query?.trim()) return [];

    try {
      const result = await this.esService.search({
        index: this.indexName,
        query: {
          bool: {
            must: [
              {
                match_phrase_prefix: {
                  title: {
                    query: query.trim(),
                    max_expansions: 50,
                  },
                },
              },
            ],
            filter: [
              { term: { status: 'ACTIVE' } },
              { term: { moderationStatus: 'APPROVED' } },
            ],
          },
        },
        _source: ['title'],
        size,
      });

      const hits = result.hits.hits as any[];
      const titles = hits.map((h) => h._source.title as string);
      return Array.from(new Set(titles));
    } catch (e) {
      this.logger.warn(`ES autocomplete failed: ${e}`);
      return [];
    }
  }
}
