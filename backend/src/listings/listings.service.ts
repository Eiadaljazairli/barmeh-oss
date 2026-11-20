import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateListingDto } from './dto/create-listing.dto';
import { AbuseService } from '../abuse/abuse.service';
import { SearchService } from '../search/search.service';
import { RedisService } from '../redis/redis.service';
import { sanitize } from '../common/utils/validation';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
  PriceStatus,
  NotificationType,
  UserType,
  ListingStatus,
  ModerationStatus,
  Prisma,
  City,
  BookingStatus,
} from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { ModerationService } from '../moderation/moderation.service';

@Injectable()
export class ListingsService {
  private readonly logger = new Logger(ListingsService.name);

  constructor(
    private prisma: PrismaService,
    private abuseService: AbuseService,
    private searchService: SearchService,
    private redis: RedisService,
    private notificationsService: NotificationsService,
    private moderationService: ModerationService,
    private eventEmitter: EventEmitter2,
  ) {}

  async countAll(): Promise<number> {
    return this.prisma.listing.count({
      where: { status: 'ACTIVE' },
    });
  }

  async autocomplete(query: string): Promise<string[]> {
    if (!query?.trim()) return [];
    if (this.searchService.isUnavailable()) {
      const listings = await this.prisma.listing.findMany({
        where: {
          title: { startsWith: query.trim(), mode: 'insensitive' },
          status: 'ACTIVE',
          moderationStatus: 'APPROVED',
        },
        select: { title: true },
        take: 5,
        distinct: ['title'],
      });
      return listings.map((l) => l.title);
    }
    return this.searchService.autocomplete(query);
  }

  async findAllAdmin(take = 200, skip = 0) {
    const listings = await this.prisma.listing.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        images: { orderBy: { order: 'asc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
      take,
      skip,
    });
    return listings.map((l) => ({
      ...l,
      user: l.user
        ? {
            ...l.user,
            name:
              [l.user.firstName, l.user.lastName].filter(Boolean).join(' ') ||
              l.user.username ||
              'مستخدم',
          }
        : null,
    }));
  }

  async findByUser(userId: string, requesterId?: string) {
    if (requesterId && requesterId !== userId) {
      const block = await this.prisma.userBlock.findFirst({
        where: {
          OR: [
            { blockerId: requesterId, blockedId: userId },
            { blockerId: userId, blockedId: requesterId },
          ],
        },
        select: { id: true },
      });
      if (block) return [];
    }

    const listings = await this.prisma.listing.findMany({
      where: { userId, deletedAt: null },
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
            trustScore: true,
            userType: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return listings.map((l) => ({
      ...l,
      user: l.user
        ? {
            ...l.user,
            name:
              [l.user.firstName, l.user.lastName].filter(Boolean).join(' ') ||
              l.user.username ||
              'مستخدم',
          }
        : null,
    }));
  }

  private async checkDuplicateListing(
    userId: string,
    title: string,
    description: string,
  ) {
    const last48h = new Date(Date.now() - 48 * 60 * 60 * 1000);

    const existing = await this.prisma.listing.findFirst({
      where: {
        userId,
        OR: [
          { title: { equals: title, mode: 'insensitive' } },
          { description: { equals: description, mode: 'insensitive' } },
        ],
        createdAt: { gte: last48h },
        deletedAt: null,
      },
    });

    if (existing) {
      throw new BadRequestException(
        'لقد قمت بنشر إعلان مشابه جداً مؤخراً. يرجى تعديل الإعلان السابق أو الانتظار قبل النشر مجدداً لمنع التكرار.',
      );
    }
  }

  private async checkListingLimit(userId: string, userType: UserType) {
    const activeCount = await this.prisma.listing.count({
      where: { userId, status: 'ACTIVE', deletedAt: null },
    });

    const limit = userType === UserType.MERCHANT ? 50 : 10;

    if (activeCount >= limit) {
      throw new BadRequestException(
        `لقد وصلت للحد الأعلى من الإعلانات النشطة المسموحة لك (${limit}). يرجى حذف إعلان قديم أو تمييز إعلان كمباع لتتمكن من النشر مجدداً.`,
      );
    }
  }

  async create(dto: CreateListingDto, userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { userType: true },
    });
    if (user) {
      await this.checkListingLimit(userId, user.userType);
    }

    const cleanTitle = sanitize(dto.title);
    const cleanDesc = sanitize(dto.description || '');

    const combinedText = `${cleanTitle}\n${cleanDesc}`;
    const moderation = await this.moderationService.moderateText(
      combinedText,
      'listing',
    );

    if (moderation.status === ModerationStatus.AUTO_REJECTED) {
      throw new BadRequestException(
        moderation.reason || 'تم رفض الإعلان بسبب مخالفة شروط المحتوى.',
      );
    }

    await this.checkDuplicateListing(userId, cleanTitle, cleanDesc);

    const evaluation = await this.abuseService.evaluateListing(
      userId,
      dto.price,
      dto.categoryId,
      dto.city,
      dto.title,
      dto.description,
    );

    const { attributes, priceStatus, ...rest } = dto;
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const listing = await this.prisma.listing.create({
      data: {
        ...rest,
        title: cleanTitle,
        description: cleanDesc,
        userId,
        priceStatus:
          (priceStatus?.toUpperCase() as PriceStatus) || PriceStatus.NEGOTIABLE,
        metadata: attributes || {},
        expiresAt,
        moderationStatus: moderation.status,
        moderationReason: moderation.reason,
        moderationFlaggedBy: moderation.flaggedBy,
      },
    });

    await this.moderationService.logDecision({
      listingId: listing.id,
      decision: moderation.status,
      reason: moderation.reason,
      source: moderation.flaggedBy || 'static',
    });

    const shouldIndex =
      evaluation.isSafe && moderation.status === ModerationStatus.APPROVED;

    if (shouldIndex) {
      this.searchService
        .indexListing({
          ...listing,
          location:
            listing.latitude && listing.longitude
              ? { lat: listing.latitude, lon: listing.longitude }
              : null,
        } as any)
        .catch((e) =>
          this.logger.error(
            `ES index failed for listing ${listing.id}: ${e.message}`,
          ),
        );
    }

    if (moderation.status === ModerationStatus.FLAGGED) {
      this.logger.warn(
        `Listing ${listing.id} flagged for review: ${moderation.reason}`,
      );
    }

    this.eventEmitter.emit('listing.updated', listing);
    return { ...listing, evaluation, moderation };
  }

  async update(
    id: string,
    dto: Partial<CreateListingDto>,
    userId: string,
    isAdmin: boolean = false,
  ) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.userId !== userId && !isAdmin)
      throw new ForbiddenException('لا تملك صلاحية تعديل هذا الإعلان');

    const { attributes, priceStatus, title, description, ...rest } = dto;

    const updateData: any = {
      ...rest,
      priceStatus: priceStatus
        ? (priceStatus.toUpperCase() as PriceStatus)
        : undefined,
      metadata: attributes ? attributes : undefined,
    };

    if (title !== undefined) updateData.title = sanitize(title);
    if (description !== undefined)
      updateData.description = sanitize(description);

    const updated = await this.prisma.listing.update({
      where: { id },
      data: updateData,
    });

    this.searchService
      .indexListing({
        ...updated,
        location:
          updated.latitude && updated.longitude
            ? { lat: updated.latitude, lon: updated.longitude }
            : null,
      } as any)
      .catch(() => {});

    this.eventEmitter.emit('listing.updated', updated);

    return updated;
  }

  async findAll(
    query?: string,
    city?: string,
    categoryId?: string,
    minPrice?: number,
    maxPrice?: number,
    cursor?: string,
    limit = 20,
    lat?: number,
    lng?: number,
    distance?: number,
    priceStatus?: string,
    requesterId?: string,
    attributes?: Record<string, string>,
    sortBy?: string,
    condition?: string,
  ) {
    this.logger.debug(
      `findAll called with: query=${query}, city=${city}, limit=${limit}`,
    );
    const safeLimit = Math.min(Math.max(limit, 1), 100);

    let excludedUserIds: string[] = [];
    if (
      requesterId &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requesterId,
      )
    ) {
      const blocks = await this.prisma.userBlock.findMany({
        where: {
          OR: [{ blockerId: requesterId }, { blockedId: requesterId }],
        },
        select: { blockerId: true, blockedId: true },
      });
      excludedUserIds = Array.from(
        new Set(blocks.flatMap((b) => [b.blockerId, b.blockedId])),
      ).filter((id) => id !== requesterId);
    }

    const hasAttributeFilter = attributes && Object.keys(attributes).length > 0;
    const hasConditionFilter = !!condition && condition !== 'ALL';
    const hasCustomSort = !!sortBy && sortBy !== 'LATEST';
    let categoryIsParent = false;
    if (categoryId) {
      const childCount = await this.prisma.category.count({
        where: { parentId: categoryId },
      });
      categoryIsParent = childCount > 0;
    }
    if (
      hasAttributeFilter ||
      hasConditionFilter ||
      hasCustomSort ||
      categoryIsParent
    ) {
      return this.findAllFromDb(
        query,
        city,
        categoryId,
        minPrice,
        maxPrice,
        cursor,
        safeLimit,
        lat,
        lng,
        priceStatus,
        excludedUserIds,
        attributes,
        sortBy,
        condition,
      );
    }

    const esResult = await this.searchService.searchListings(
      query || '',
      city,
      categoryId,
      minPrice,
      maxPrice,
      cursor,
      lat,
      lng,
      distance,
      priceStatus,
      safeLimit,
      excludedUserIds,
    );

    if (
      esResult.items.length === 0 &&
      this.searchService.isUnavailable() === true
    ) {
      return this.findAllFromDb(
        query,
        city,
        categoryId,
        minPrice,
        maxPrice,
        cursor,
        safeLimit,
        lat,
        lng,
        priceStatus,
        excludedUserIds,
      );
    }

    esResult.items = await this.hydrateSellers(esResult.items);
    return esResult;
  }

  private async hydrateSellers(items: any[]): Promise<any[]> {
    if (!items || items.length === 0) return items;
    const userIds = [
      ...new Set(items.map((i) => i.userId).filter(Boolean)),
    ] as string[];
    if (userIds.length === 0) return items;

    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        userType: true,
        trustLevel: true,
        trustScore: true,
      },
    });
    const byId = new Map(users.map((u) => [u.id, u]));

    return items.map((item) => {
      const u = byId.get(item.userId);
      if (!u) return item;
      return {
        ...item,
        user: {
          ...u,
          name:
            [u.firstName, u.lastName].filter(Boolean).join(' ') || undefined,
        },
      };
    });
  }

  private async findAllFromDb(
    query: string | undefined,
    city: string | undefined,
    categoryId: string | undefined,
    minPrice: number | undefined,
    maxPrice: number | undefined,
    cursor: string | undefined,
    limit: number,
    lat?: number,
    lng?: number,
    priceStatus?: string,
    excludedUserIds: string[] = [],
    attributes?: Record<string, string>,
    sortBy?: string,
    condition?: string,
  ) {
    const where: Prisma.ListingWhereInput = {
      status: 'ACTIVE',
      moderationStatus: ModerationStatus.APPROVED,
      user: { isBlocked: false },
    };
    if (excludedUserIds.length > 0) {
      where.userId = { notIn: excludedUserIds };
    }
    if (city) where.city = city as City;
    if (categoryId) {
      const children = await this.prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      where.categoryId =
        children.length > 0
          ? { in: [categoryId, ...children.map((c) => c.id)] }
          : categoryId;
    }
    if (priceStatus)
      where.priceStatus = priceStatus.toUpperCase() as PriceStatus;
    if (minPrice != null || maxPrice != null) {
      where.price = {};
      if (minPrice != null) where.price.gte = minPrice;
      if (maxPrice != null) where.price.lte = maxPrice;
    }
    if (query?.trim()) {
      where.OR = [
        { title: { contains: query.trim(), mode: 'insensitive' } },
        { description: { contains: query.trim(), mode: 'insensitive' } },
      ];
    }
    if (cursor) {
      const cursorDate = new Date(cursor);
      if (!isNaN(cursorDate.getTime())) {
        where.createdAt = { lt: cursorDate };
      }
    }

    if (attributes && Object.keys(attributes).length > 0) {
      const attrConditions: Prisma.ListingWhereInput[] = Object.entries(
        attributes,
      ).map(([key, value]) => ({
        metadata: { path: [key], equals: value } as any,
      }));
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        ...attrConditions,
      ];
    }

    if (condition === 'NEW') {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { metadata: { path: ['condition'], equals: 'new' } },
      ];
    } else if (condition === 'USED') {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        { NOT: { metadata: { path: ['condition'], equals: 'new' } } },
        { metadata: { path: ['condition'], not: Prisma.DbNull } },
      ];
    }

    if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
      const latDelta = 0.45;
      const lngDelta = 0.55;
      where.latitude = { gte: lat - latDelta, lte: lat + latDelta };
      where.longitude = { gte: lng - lngDelta, lte: lng + lngDelta };
    }

    let orderBy: Prisma.ListingOrderByWithRelationInput[];
    switch (sortBy) {
      case 'PRICE_ASC':
        orderBy = [
          { promotionOrder: 'desc' },
          { price: 'asc' },
          { createdAt: 'desc' },
        ];
        break;
      case 'PRICE_DESC':
        orderBy = [
          { promotionOrder: 'desc' },
          { price: 'desc' },
          { createdAt: 'desc' },
        ];
        break;
      case 'POPULAR':
        orderBy = [
          { promotionOrder: 'desc' },
          { favoritedBy: { _count: 'desc' } },
          { createdAt: 'desc' },
        ];
        break;
      case 'LATEST':
      default:
        orderBy = [{ promotionOrder: 'desc' }, { createdAt: 'desc' }];
    }

    const items = await this.prisma.listing.findMany({
      where,
      include: {
        images: { orderBy: { order: 'asc' }, take: 1 },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            userType: true,
            trustLevel: true,
            trustScore: true,
          },
        },
      },
      orderBy,
      take: limit,
    });

    const cursorPaginationActive = !sortBy || sortBy === 'LATEST';
    const nextCursor =
      cursorPaginationActive && items.length === limit
        ? items[items.length - 1].createdAt.toISOString()
        : null;

    const itemsWithAttributes = items.map((item) => ({
      ...item,
      attributes: item.metadata,
      user: item.user
        ? {
            ...item.user,
            name:
              [item.user.firstName, item.user.lastName]
                .filter(Boolean)
                .join(' ') || undefined,
          }
        : item.user,
      promotion: item.promotionType
        ? {
            type: item.promotionType,
            expiresAt: item.promotionExpiresAt,
          }
        : null,
    }));

    return { items: itemsWithAttributes, nextCursor };
  }

  async findOne(id: string) {
    if (
      !id ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        id,
      )
    ) {
      throw new NotFoundException('الإعلان غير موجود');
    }
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
            avatarUrl: true,
            trustScore: true,
            createdAt: true,
            userType: true,
            merchantProfile: true,
          },
        },
        category: { select: { id: true, slug: true, nameAr: true } },
      },
    });

    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.status === 'BLOCKED') {
      throw new NotFoundException('الإعلان غير متاح');
    }

    return {
      ...listing,
      attributes: (listing as any).metadata || {},
      user: listing.user
        ? {
            ...listing.user,
            name:
              [listing.user.firstName, listing.user.lastName]
                .filter(Boolean)
                .join(' ') ||
              listing.user.username ||
              'مستخدم',
          }
        : null,
    };
  }

  async getContact(listingId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: {
        status: true,
        user: { select: { id: true } },
      },
    });
    if (!listing || listing.status === 'BLOCKED') {
      throw new NotFoundException('الإعلان غير موجود');
    }
    return { sellerId: listing.user.id };
  }

  async report(listingId: string, reporterId: string, reason: string) {
    const trimmedReason = (reason ?? '').trim();
    if (trimmedReason.length < 5 || trimmedReason.length > 500) {
      throw new ForbiddenException('سبب البلاغ يجب أن يكون بين 5 و 500 حرف');
    }

    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
    });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');

    const report = await this.prisma.report.upsert({
      where: { unique_listing_report: { reporterId, listingId } },
      update: { reason: trimmedReason },
      create: { listingId, reporterId, reason: trimmedReason },
    });

    const severeKeywords = [
      'سرقة',
      'مسروق',
      'مشبوه',
      'نصب',
      'احتيال',
      'ممنوع',
      'مسروقة',
      'مهرب',
      'نصاب',
    ];
    const isSevere = severeKeywords.some((kw) => trimmedReason.includes(kw));

    if (isSevere && listing.status !== 'BLOCKED') {
      await this.prisma.listing.update({
        where: { id: listingId },
        data: { status: 'BLOCKED' },
      });

      await this.searchService.removeListing(listingId).catch(() => {});

      await this.prisma.supportTicket.create({
        data: {
          userId: reporterId,
          subject: 'إبلاغ تلقائي: حالة احتيال / مشكلة قانونية',
          description: `تم الإبلاغ عن الإعلان رقم ${listingId} (العنوان: ${listing.title}) \nالسبب: ${trimmedReason}\nصاحب الإعلان: ${listing.userId}\nتم تقييد الإعلان للتحقيق.`,
          city: listing.city,
          status: 'ESCALATED_TO_POLICE',
          isEscalated: true,
        },
      });

      this.logger.warn(
        `[ESC_POLICE] Listing ${listingId} BLOCKED and ESCALATED due to report: ${trimmedReason}`,
      );
    }

    return report;
  }

  async toggleFavorite(listingId: string, userId: string) {
    const existing = await this.prisma.favorite.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      await this.prisma.favorite.delete({
        where: { userId_listingId: { userId, listingId } },
      });
      return { favorited: false };
    }
    await this.prisma.favorite.create({ data: { userId, listingId } });
    return { favorited: true };
  }

  async getFavorites(userId: string, limit = 30) {
    const favs = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            images: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return favs.map((f) => f.listing);
  }

  async togglePurchase(listingId: string, userId: string) {
    const existing = await this.prisma.purchase.findUnique({
      where: { userId_listingId: { userId, listingId } },
    });
    if (existing) {
      await this.prisma.purchase.delete({
        where: { userId_listingId: { userId, listingId } },
      });
      return { purchased: false };
    }
    await this.prisma.purchase.create({ data: { userId, listingId } });
    return { purchased: true };
  }

  async getPurchases(userId: string, limit = 30) {
    const purchases = await this.prisma.purchase.findMany({
      where: { userId },
      include: {
        listing: {
          include: {
            images: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(limit, 100),
    });
    return purchases.map((p) => p.listing);
  }

  private async safeRedisGet(key: string): Promise<string | null> {
    try {
      return await this.redis.client.get(key);
    } catch (e: any) {
      this.logger.warn(`Redis GET failed (${key}): ${e?.message ?? e}`);
      return null;
    }
  }
  private async safeRedisSet(
    key: string,
    value: string,
    ttlSec: number,
  ): Promise<void> {
    try {
      await this.redis.client.set(key, value, 'EX', ttlSec);
    } catch (e: any) {
      this.logger.warn(`Redis SET failed (${key}): ${e?.message ?? e}`);
    }
  }
  private async safeRedisDel(key: string): Promise<void> {
    try {
      await this.redis.client.del(key);
    } catch (e: any) {
      this.logger.warn(`Redis DEL failed (${key}): ${e?.message ?? e}`);
    }
  }

  async remove(id: string, userId: string, isAdmin: boolean) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
    });

    if (!listing) throw new NotFoundException('الإعلان غير موجود');

    if (listing.userId !== userId && !isAdmin) {
      throw new ForbiddenException('ليس لديك صلاحية لحذف هذا الإعلان');
    }

    await this.prisma.listing.update({
      where: { id },
      data: {
        status: 'DELETED',
        deletedAt: new Date(),
      },
    });

    this.searchService
      .removeListing(id)
      .catch((e) =>
        this.logger.error(`ES remove failed for listing ${id}: ${e.message}`),
      );

    this.eventEmitter.emit('listing.updated', listing);

    return { success: true, message: 'تم حذف الإعلان بنجاح' };
  }

  async getStatsByCity() {
    const stats = await this.prisma.listing.groupBy({
      by: ['city'],
      _count: {
        _all: true,
      },
      where: {
        status: 'ACTIVE',
      },
      orderBy: {
        _count: {
          city: 'desc',
        },
      },
      take: 5,
    });

    return stats.map((s) => ({
      city: s.city,
      count: s._count._all,
    }));
  }

  async getStatsByDay() {
    const days = 7;
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    start.setHours(0, 0, 0, 0);

    const recent = await this.prisma.listing.findMany({
      where: { createdAt: { gte: start } },
      select: { createdAt: true },
    });

    const buckets: { date: string; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      buckets.push({ date: d.toISOString().slice(0, 10), count: 0 });
    }

    for (const l of recent) {
      const iso = new Date(l.createdAt).toISOString().slice(0, 10);
      const b = buckets.find((x) => x.date === iso);
      if (b) b.count++;
    }

    return buckets;
  }

  async book(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!listing) throw new NotFoundException('Listing not found');
    if (listing.userId === userId) {
      throw new BadRequestException('You cannot book your own listing');
    }

    const existing = await this.prisma.booking.findFirst({
      where: {
        listingId: listing.id,
        requesterId: userId,
        status: BookingStatus.PENDING,
      },
    });
    if (existing) {
      throw new BadRequestException('لديك طلب حجز معلّق لهذا الإعلان بالفعل');
    }

    const requester = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    const requesterName =
      [requester?.firstName, requester?.lastName].filter(Boolean).join(' ') ||
      'مستخدم';

    const booking = await this.prisma.booking.create({
      data: {
        listingId: listing.id,
        requesterId: userId,
        sellerId: listing.userId,
      },
    });

    await this.notificationsService.create({
      userId: listing.userId,
      title: 'طلب حجز جديد',
      body: `أرسل ${requesterName} طلب حجز لإعلانك: ${listing.title}`,
      type: NotificationType.BOOKING,
      referenceId: booking.id,
    });

    return { success: true, message: 'Booking request sent to seller' };
  }

  async respondToBooking(bookingId: string, sellerId: string, accept: boolean) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { listing: { select: { title: true } } },
    });
    if (!booking) throw new NotFoundException('طلب الحجز غير موجود');
    if (booking.sellerId !== sellerId) {
      throw new ForbiddenException('لا تملك صلاحية الرد على هذا الطلب');
    }
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('تمت معالجة هذا الطلب مسبقاً');
    }

    const status = accept ? BookingStatus.ACCEPTED : BookingStatus.REJECTED;

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status, respondedAt: new Date() },
    });

    if (accept) {
      const reserved = await this.prisma.listing.update({
        where: { id: booking.listingId },
        data: { status: ListingStatus.RESERVED },
      });
      this.eventEmitter.emit('listing.updated', reserved);
    }

    await this.notificationsService.create({
      userId: booking.requesterId,
      title: accept ? 'تم قبول طلب الحجز' : 'تم رفض طلب الحجز',
      body: accept
        ? `تم قبول طلب حجزك لإعلان: ${booking.listing.title}`
        : `تم رفض طلب حجزك لإعلان: ${booking.listing.title}`,
      type: NotificationType.BOOKING,
      referenceId: booking.id,
    });

    return updated;
  }

  async cancelBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: { select: { id: true, title: true, status: true } },
      },
    });
    if (!booking) throw new NotFoundException('طلب الحجز غير موجود');
    if (booking.requesterId !== userId) {
      throw new ForbiddenException('لا تملك صلاحية إلغاء هذا الطلب');
    }
    if (booking.status === BookingStatus.CANCELLED) {
      return booking;
    }
    if (booking.status === BookingStatus.REJECTED) {
      throw new BadRequestException('لا يمكن إلغاء طلب مرفوض');
    }

    const wasAccepted = booking.status === BookingStatus.ACCEPTED;

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED, respondedAt: new Date() },
    });

    if (wasAccepted && booking.listing.status === ListingStatus.RESERVED) {
      const relisted = await this.prisma.listing.update({
        where: { id: booking.listingId },
        data: { status: ListingStatus.ACTIVE },
      });
      this.eventEmitter.emit('listing.updated', relisted);
    }

    await this.notificationsService.create({
      userId: booking.sellerId,
      title: 'تم إلغاء طلب حجز',
      body: `ألغى المشتري طلب الحجز لإعلانك: ${booking.listing.title}`,
      type: NotificationType.BOOKING,
      referenceId: booking.id,
    });

    return updated;
  }

  async getMyBookingForListing(listingId: string, userId: string) {
    const booking = await this.prisma.booking.findFirst({
      where: {
        listingId,
        requesterId: userId,
        status: { in: [BookingStatus.PENDING, BookingStatus.ACCEPTED] },
      },
      orderBy: { createdAt: 'desc' },
    });
    return { booking: booking ?? null };
  }

  async getMyBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { requesterId: userId },
      orderBy: { createdAt: 'desc' },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            status: true,
            images: {
              select: { thumbUrl: true, mediumUrl: true },
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
        seller: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
  }

  async getBooking(bookingId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        listing: { select: { id: true, title: true } },
        requester: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    });
    if (!booking) throw new NotFoundException('طلب الحجز غير موجود');
    if (booking.sellerId !== userId && booking.requesterId !== userId) {
      throw new ForbiddenException('لا تملك صلاحية عرض هذا الطلب');
    }
    return booking;
  }

  async bump(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({
      where: { id },
      select: { id: true, userId: true, status: true, bumpedAt: true },
    });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.userId !== userId) {
      throw new ForbiddenException('لا تملك صلاحية رفع هذا الإعلان');
    }
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('يمكن رفع الإعلانات النشطة فقط');
    }
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    if (listing.bumpedAt > sevenDaysAgo) {
      throw new BadRequestException('يمكنك رفع الإعلان مرة واحدة كل 7 أيام');
    }

    const updated = await this.prisma.listing.update({
      where: { id },
      data: { bumpedAt: new Date() },
    });
    this.eventEmitter.emit('listing.updated', updated);
    return updated;
  }

  async setReserved(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.userId !== userId) {
      throw new ForbiddenException('فقط مالك الإعلان يمكنه حجزه');
    }
    if (listing.status !== ListingStatus.ACTIVE) {
      throw new BadRequestException('يمكن حجز الإعلانات النشطة فقط');
    }
    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.RESERVED },
    });
    this.eventEmitter.emit('listing.updated', updated);
    return updated;
  }

  async setActive(id: string, userId: string) {
    const listing = await this.prisma.listing.findUnique({ where: { id } });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.userId !== userId) {
      throw new ForbiddenException('فقط مالك الإعلان يمكنه تعديل حالته');
    }
    if (listing.status !== ListingStatus.RESERVED) {
      throw new BadRequestException('الإعلان ليس بحالة محجوز');
    }
    const updated = await this.prisma.listing.update({
      where: { id },
      data: { status: ListingStatus.ACTIVE },
    });
    this.eventEmitter.emit('listing.updated', updated);
    return updated;
  }

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async handleExpiryCron() {
    const now = new Date();
    const result = await this.prisma.listing.updateMany({
      where: {
        status: ListingStatus.ACTIVE,
        expiresAt: { lt: now },
        deletedAt: null,
      },
      data: { status: ListingStatus.EXPIRED },
    });
    if (result.count > 0) {
      this.logger.log(`Auto-expired ${result.count} listings`);
    }
  }
}
