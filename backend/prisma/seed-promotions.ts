import { PrismaClient, PromotionType } from '@prisma/client';

const prisma = new PrismaClient();

async function seedPromotions() {
  const products = [
    {
      type: PromotionType.TOP_PLACEMENT,
      durationDays: 1,
      priceSYP: 65000,
      label: null,
    },
    {
      type: PromotionType.TOP_PLACEMENT,
      durationDays: 3,
      priceSYP: 170000,
      label: null,
    },
    {
      type: PromotionType.TOP_PLACEMENT,
      durationDays: 7,
      priceSYP: 325000,
      label: 'الأكثر مبيعاً',
    },
    {
      type: PromotionType.TOP_PLACEMENT,
      durationDays: 30,
      priceSYP: 650000,
      label: null,
    },
    {
      type: PromotionType.FEATURED,
      durationDays: 3,
      priceSYP: 50000,
      label: null,
    },
    {
      type: PromotionType.FEATURED,
      durationDays: 7,
      priceSYP: 130000,
      label: null,
    },
    {
      type: PromotionType.FEATURED,
      durationDays: 30,
      priceSYP: 390000,
      label: null,
    },
    {
      type: PromotionType.URGENT,
      durationDays: 3,
      priceSYP: 25000,
      label: null,
    },
    {
      type: PromotionType.URGENT,
      durationDays: 7,
      priceSYP: 65000,
      label: null,
    },
  ];

  for (const p of products) {
    await prisma.promotionProduct.upsert({
      where: {
        type_durationDays: { type: p.type, durationDays: p.durationDays },
      },
      update: { priceSYP: p.priceSYP, label: p.label },
      create: { ...p },
    });
  }

  const settings = [
    {
      key: 'EUR_TO_SYP_RATE',
      value: '13000',
      description: 'سعر صرف اليورو مقابل الليرة السورية',
    },
    {
      key: 'LAUNCH_DISCOUNT_PERCENT',
      value: '50',
      description: 'خصم الإطلاق للترقية الأولى',
    },
    {
      key: 'FREE_PROMO_NEW_USER_DAYS',
      value: '3',
      description: 'أيام ترقية مجانية للحسابات الجديدة',
    },
  ];

  for (const s of settings) {
    await prisma.platformSetting.upsert({
      where: { key: s.key },
      update: {},
      create: s,
    });
  }

  console.log(
    `✅ تم بذر ${products.length} منتج ترويجي و ${settings.length} إعداد منصة`,
  );
}

seedPromotions()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
