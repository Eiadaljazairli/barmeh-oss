import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class SavedSearchesService {
  private readonly logger = new Logger(SavedSearchesService.name);

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(userId: string, data: { query?: string; filters: any }) {
    const existing = await this.prisma.savedSearch.findFirst({
      where: {
        userId,
        query: data.query || null,
      },
    });

    if (existing) {
      return existing;
    }

    return this.prisma.savedSearch.create({
      data: {
        userId,
        query: data.query,
        filters: data.filters || {},
      },
    });
  }

  async findAll(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async remove(userId: string, id: string) {
    return this.prisma.savedSearch.delete({
      where: { id, userId },
    });
  }

  @Cron(CronExpression.EVERY_30_MINUTES)
  async handleCron() {
    this.logger.log('Checking for new listings matching saved searches...');
    const searches = await this.prisma.savedSearch.findMany();

    for (const search of searches) {
      try {
        await this.checkSearch(search);
      } catch (err) {
        this.logger.error(`Error checking search ${search.id}: ${err.message}`);
      }
    }
  }

  private async checkSearch(search: any) {
    const filters = search.filters;
    const where: any = {
      status: 'ACTIVE',
      createdAt: { gt: search.lastNotifiedAt },
      deletedAt: null,
    };

    if (search.query && search.query.trim() !== '') {
      where.OR = [
        { title: { contains: search.query, mode: 'insensitive' } },
        { description: { contains: search.query, mode: 'insensitive' } },
      ];
    }

    if (filters.city) where.city = filters.city;
    if (filters.categoryId) where.categoryId = filters.categoryId;

    if (filters.minPrice || filters.maxPrice) {
      where.price = {};
      if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
      if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
    }

    const newListings = await this.prisma.listing.findMany({
      where,
      take: 5,
      orderBy: { createdAt: 'desc' },
    });

    if (newListings.length > 0) {
      const prefs = await this.prisma.notificationPreference.findUnique({
        where: { userId: search.userId },
      });

      if (!prefs || prefs.newListings) {
        const count = newListings.length;
        const firstTitle = newListings[0].title;

        await this.notifications.create({
          userId: search.userId,
          title: `إعلانات جديدة تطابق بحثك! 🔔`,
          body:
            count === 1
              ? `إعلان جديد يطابق اهتمامك: ${firstTitle}`
              : `هناك ${count} إعلانات جديدة تطابق بحثك المحفوظ "${search.query || 'بدون عنوان'}"`,
          type: NotificationType.LISTING_UPDATE,
          referenceId: newListings[0].id,
        });
      }

      await this.prisma.savedSearch.update({
        where: { id: search.id },
        data: { lastNotifiedAt: new Date() },
      });
    }
  }
}
