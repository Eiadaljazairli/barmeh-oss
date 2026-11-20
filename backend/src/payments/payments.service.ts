import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaymentMethod, PaymentStatus, PromotionType } from '@prisma/client';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(private prisma: PrismaService) {}

  async getProducts() {
    const products = await this.prisma.promotionProduct.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { durationDays: 'asc' }],
    });

    const rateSetting = await this.prisma.platformSetting.findUnique({
      where: { key: 'EUR_TO_SYP_RATE' },
    });
    const eurToSyp = rateSetting ? parseInt(rateSetting.value) : 13000;

    return {
      products: products.map((p) => ({
        ...p,
        priceEUR: +(p.priceSYP / eurToSyp).toFixed(2),
        effectivePrice:
          p.discountPercent > 0
            ? Math.round(p.priceSYP * (1 - p.discountPercent / 100))
            : p.priceSYP,
      })),
      eurToSyp,
    };
  }

  async createTransaction(
    userId: string,
    listingId: string,
    productId: string,
    paymentMethod: PaymentMethod,
  ) {
    const listing = await this.prisma.listing.findFirst({
      where: { id: listingId, userId, deletedAt: null },
    });
    if (!listing) throw new NotFoundException('الإعلان غير موجود أو ليس لك');

    const product = await this.prisma.promotionProduct.findFirst({
      where: { id: productId, isActive: true },
    });
    if (!product) throw new NotFoundException('المنتج الترويجي غير متاح');

    const existingPromo = await this.prisma.activePromotion.findFirst({
      where: {
        listingId,
        type: product.type,
        isActive: true,
        expiresAt: { gt: new Date() },
      },
    });
    if (existingPromo) {
      throw new BadRequestException(
        'يوجد ترقية نشطة من نفس النوع على هذا الإعلان',
      );
    }

    const effectivePrice =
      product.discountPercent > 0
        ? Math.round(product.priceSYP * (1 - product.discountPercent / 100))
        : product.priceSYP;

    const transaction = await this.prisma.transaction.create({
      data: {
        userId,
        listingId,
        productId,
        amountSYP: effectivePrice,
        paymentMethod,
        status:
          paymentMethod === 'FREE'
            ? PaymentStatus.COMPLETED
            : PaymentStatus.PENDING,
      },
      include: { product: true },
    });

    if (paymentMethod === 'FREE') {
      await this.activatePromotion(transaction.id);
    }

    this.logger.log(
      `💳 عملية دفع جديدة: ${transaction.id} | ${paymentMethod} | ${effectivePrice} ل.س`,
    );
    return transaction;
  }

  async activatePromotion(transactionId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { product: true },
    });
    if (!tx) throw new NotFoundException('العملية غير موجودة');
    if (!tx.listingId)
      throw new BadRequestException('العملية غير مرتبطة بإعلان');

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + tx.product.durationDays);

    const orderMap: Record<PromotionType, number> = {
      TOP_PLACEMENT: 30,
      FEATURED: 20,
      URGENT: 10,
    };

    const [promo] = await this.prisma.$transaction([
      this.prisma.activePromotion.create({
        data: {
          listingId: tx.listingId,
          transactionId: tx.id,
          type: tx.product.type,
          expiresAt,
        },
      }),
      this.prisma.listing.update({
        where: { id: tx.listingId },
        data: {
          promotionType: tx.product.type,
          promotionExpiresAt: expiresAt,
          promotionOrder: orderMap[tx.product.type],
          isFeatured:
            tx.product.type === 'FEATURED' ||
            tx.product.type === 'TOP_PLACEMENT',
        },
      }),
      this.prisma.transaction.update({
        where: { id: tx.id },
        data: { status: PaymentStatus.COMPLETED },
      }),
    ]);

    this.logger.log(
      `🚀 ترقية مفعّلة: ${tx.listingId} | ${tx.product.type} | حتى ${expiresAt.toISOString()}`,
    );
    return promo;
  }

  async approveManualPayment(transactionId: string, adminId: string) {
    const tx = await this.prisma.transaction.findUnique({
      where: { id: transactionId },
    });
    if (!tx) throw new NotFoundException('العملية غير موجودة');
    if (tx.status !== PaymentStatus.PENDING) {
      throw new BadRequestException('العملية ليست بحالة انتظار');
    }

    await this.prisma.transaction.update({
      where: { id: transactionId },
      data: { processedBy: adminId, processedAt: new Date() },
    });

    return this.activatePromotion(transactionId);
  }

  async rejectManualPayment(
    transactionId: string,
    adminId: string,
    reason: string,
  ) {
    return this.prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: PaymentStatus.FAILED,
        processedBy: adminId,
        processedAt: new Date(),
        notes: reason,
      },
    });
  }

  async getUserTransactions(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getRevenueStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [dailyRevenue, monthlyRevenue, totalTransactions, pendingManual] =
      await Promise.all([
        this.prisma.transaction.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: today } },
          _sum: { amountSYP: true },
          _count: true,
        }),
        this.prisma.transaction.aggregate({
          where: { status: 'COMPLETED', createdAt: { gte: monthStart } },
          _sum: { amountSYP: true },
          _count: true,
        }),
        this.prisma.transaction.count({ where: { status: 'COMPLETED' } }),
        this.prisma.transaction.count({ where: { status: 'PENDING' } }),
      ]);

    return {
      daily: {
        revenue: dailyRevenue._sum.amountSYP || 0,
        count: dailyRevenue._count,
      },
      monthly: {
        revenue: monthlyRevenue._sum.amountSYP || 0,
        count: monthlyRevenue._count,
      },
      totalTransactions,
      pendingManual,
    };
  }
}
