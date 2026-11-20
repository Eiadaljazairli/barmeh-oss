import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromotionsService {
  private readonly logger = new Logger(PromotionsService.name);

  constructor(private prisma: PrismaService) {}

  @Cron(CronExpression.EVERY_5_MINUTES)
  async expirePromotions() {
    const now = new Date();

    const expired = await this.prisma.activePromotion.updateMany({
      where: { isActive: true, expiresAt: { lte: now } },
      data: { isActive: false },
    });

    if (expired.count === 0) return;

    const listingsToReset = await this.prisma.$queryRaw<
      { listing_id: string }[]
    >`
      SELECT DISTINCT l.id as listing_id
      FROM listings l
      WHERE l.promotion_type IS NOT NULL
        AND l.promotion_expires_at <= ${now}
        AND NOT EXISTS (
          SELECT 1 FROM active_promotions ap
          WHERE ap.listing_id = l.id AND ap.is_active = true
        )
    `;

    if (listingsToReset.length > 0) {
      await this.prisma.listing.updateMany({
        where: { id: { in: listingsToReset.map((l) => l.listing_id) } },
        data: {
          promotionType: null,
          promotionExpiresAt: null,
          promotionOrder: 0,
          isFeatured: false,
        },
      });
    }

    this.logger.log(
      `♻️ أُنهيت ${expired.count} ترقية منتهية، أُعيد ${listingsToReset.length} إعلان للعادي`,
    );
  }

  async getActivePromotions(listingId: string) {
    return this.prisma.activePromotion.findMany({
      where: { listingId, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { expiresAt: 'asc' },
    });
  }

  async verifyPromotionStatus(listingId: string): Promise<{
    isPromoted: boolean;
    type: string | null;
    expiresAt: Date | null;
  }> {
    const active = await this.prisma.activePromotion.findFirst({
      where: { listingId, isActive: true, expiresAt: { gt: new Date() } },
      orderBy: { type: 'asc' },
    });

    if (!active) {
      await this.prisma.listing.updateMany({
        where: { id: listingId, promotionType: { not: null } },
        data: {
          promotionType: null,
          promotionExpiresAt: null,
          promotionOrder: 0,
        },
      });
      return { isPromoted: false, type: null, expiresAt: null };
    }

    return { isPromoted: true, type: active.type, expiresAt: active.expiresAt };
  }
}
