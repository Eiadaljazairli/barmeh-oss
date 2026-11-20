import { PrismaClient, City } from '@prisma/client';
import { faker } from '@faker-js/faker/locale/ar';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 جاري بدء زراعة البيانات (Seeding)...');

  const categoriesData = [
    {
      slug: 'realestate',
      nameAr: 'عقارات',
      icon: 'http://localhost:3000/uploads/categories/realestate.png',
      order: 1,
      parentId: null,
    },
    {
      slug: 'cars',
      nameAr: 'مركبات',
      icon: 'http://localhost:3000/uploads/categories/cars.png',
      order: 2,
      parentId: null,
    },
    {
      slug: 'electronics',
      nameAr: 'إلكترونيات',
      icon: 'http://localhost:3000/uploads/categories/electronics.png',
      order: 3,
      parentId: null,
    },
    {
      slug: 'furniture',
      nameAr: 'أثاث',
      icon: 'http://localhost:3000/uploads/categories/furniture.png',
      order: 4,
      parentId: null,
    },
    {
      slug: 'clothing',
      nameAr: 'ملبوسات',
      icon: 'http://localhost:3000/uploads/categories/clothing.png',
      order: 5,
      parentId: null,
    },
    {
      slug: 'beauty',
      nameAr: 'مكياج وعناية',
      icon: 'http://localhost:3000/uploads/categories/beauty.png',
      order: 6,
      parentId: null,
    },
    {
      slug: 'services',
      nameAr: 'خدمات',
      icon: 'http://localhost:3000/uploads/categories/services.png',
      order: 7,
      parentId: null,
    },
    {
      slug: 'other',
      nameAr: 'أخرى',
      icon: 'http://localhost:3000/uploads/categories/other.png',
      order: 8,
      parentId: null,
    },
  ];

  console.log('📂 جاري إنشاء الأقسام الرئيسية...');
  const categories = [];
  for (const cat of categoriesData) {
    const created = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: cat,
      create: { ...cat, nameEn: cat.slug },
    });
    categories.push(created);
  }

  console.log('📂 جاري إنشاء الأقسام الفرعية...');

  const subcategoriesMap: Record<
    string,
    { slug: string; nameAr: string; icon?: string; order: number }[]
  > = {
    realestate: [
      { slug: 'realestate-apartments-sell', nameAr: 'شقق للبيع', order: 1 },
      { slug: 'realestate-apartments-rent', nameAr: 'شقق للايجار', order: 2 },
      { slug: 'realestate-villas', nameAr: 'فيلات وقصور', order: 3 },
      { slug: 'realestate-offices', nameAr: 'مكاتب وعيادات', order: 4 },
      { slug: 'realestate-shops', nameAr: 'محلات ومخازن', order: 5 },
      { slug: 'realestate-land', nameAr: 'أراضي ومزارع', order: 6 },
      {
        slug: 'realestate-commercial-other',
        nameAr: 'عقارات تجارية أخرى',
        order: 7,
      },
      { slug: 'realestate-chalets', nameAr: 'شاليهات ومصايف', order: 8 },
    ],
    cars: [
      { slug: 'cars-sedan', nameAr: 'سيارات سياحية', order: 1 },
      { slug: 'cars-suv', nameAr: 'سيارات دفع رباعي', order: 2 },
      { slug: 'cars-parts', nameAr: 'قطع غيار وإكسسوارات', order: 3 },
      { slug: 'cars-bikes', nameAr: 'دراجات نارية', order: 4 },
      { slug: 'cars-bicycles', nameAr: 'دراجات هوائية', order: 5 },
      { slug: 'cars-trucks', nameAr: 'شاحنات ومعدات ثقيلة', order: 6 },
      { slug: 'cars-maintenance', nameAr: 'صيانة وزيوت', order: 7 },
      { slug: 'cars-tires', nameAr: 'إطارات وبطاريات', order: 8 },
    ],
    electronics: [
      { slug: 'mobiles', nameAr: 'موبايلات', order: 1 },
      { slug: 'mobiles-accessories', nameAr: 'إكسسوارات موبايل', order: 2 },
      { slug: 'electronics-laptops', nameAr: 'لابتوب وكمبيوتر', order: 3 },
      { slug: 'electronics-tablets', nameAr: 'تابلت وايباد', order: 4 },
      { slug: 'electronics-gaming', nameAr: 'بلايستيشن وألعاب', order: 5 },
      { slug: 'electronics-tvs', nameAr: 'تلفزيونات وشاشات', order: 6 },
      { slug: 'electronics-cameras', nameAr: 'كاميرات وتصوير', order: 7 },
    ],
    furniture: [
      { slug: 'furniture-bedroom', nameAr: 'غرف نوم', order: 1 },
      { slug: 'furniture-living', nameAr: 'غرف جلوس وصالونات', order: 2 },
      { slug: 'furniture-kitchen', nameAr: 'مطابخ وأدواتها', order: 3 },
      { slug: 'furniture-appliances', nameAr: 'غسالات وبرادات', order: 4 },
      { slug: 'furniture-rugs', nameAr: 'سجاد ومفروشات', order: 5 },
      { slug: 'furniture-decor', nameAr: 'ديكور وإنارة', order: 6 },
    ],
    clothing: [
      { slug: 'clothing-men', nameAr: 'ملابس رجالية', order: 1 },
      { slug: 'clothing-women', nameAr: 'ملابس نسائية', order: 2 },
      { slug: 'clothing-kids', nameAr: 'ملابس أطفال', order: 3 },
      { slug: 'clothing-shoes', nameAr: 'أحذية', order: 4 },
      { slug: 'clothing-watches', nameAr: 'ساعات ومجوهرات', order: 5 },
      { slug: 'clothing-bags', nameAr: 'حقائب وإكسسوارات', order: 6 },
    ],
    beauty: [
      { slug: 'beauty-makeup', nameAr: 'مكياج', order: 1 },
      { slug: 'beauty-perfumes', nameAr: 'عطور', order: 2 },
      { slug: 'beauty-skincare', nameAr: 'العناية بالبشرة', order: 3 },
      { slug: 'beauty-haircare', nameAr: 'العناية بالشعر', order: 4 },
      { slug: 'beauty-devices', nameAr: 'أجهزة تجميل', order: 5 },
    ],
    services: [
      { slug: 'services-maintenance', nameAr: 'صيانة منزلية', order: 1 },
      { slug: 'services-moving', nameAr: 'نقل عفش ومفروشات', order: 2 },
      { slug: 'services-education', nameAr: 'تعليم ودروس خصوصية', order: 3 },
      { slug: 'services-it', nameAr: 'برمجة وتصميم', order: 4 },
      { slug: 'services-events', nameAr: 'حفلات ومناسبات', order: 5 },
    ],
    other: [
      { slug: 'other-pets', nameAr: 'حيوانات أليفة', order: 1 },
      { slug: 'other-books', nameAr: 'كتب ومستلزمات دراسية', order: 2 },
      { slug: 'other-sports', nameAr: 'رياضة ولياقة بدنية', order: 3 },
      { slug: 'other-music', nameAr: 'آلات موسيقية', order: 4 },
      { slug: 'other-tools', nameAr: 'عدد وأدوات صناعية', order: 5 },
      { slug: 'other-plants', nameAr: 'نباتات ومستلزمات حدائق', order: 6 },
    ],
  };

  for (const parent of categories) {
    const subs = subcategoriesMap[parent.slug];
    if (!subs) continue;
    for (const sub of subs) {
      await prisma.category.upsert({
        where: { slug: sub.slug },
        update: {
          parentId: parent.id,
          nameAr: sub.nameAr,
          icon: sub.icon,
          order: sub.order,
        },
        create: {
          slug: sub.slug,
          nameAr: sub.nameAr,
          nameEn: sub.slug,
          icon: sub.icon,
          order: sub.order,
          parentId: parent.id,
        },
      });
    }
  }

  const seller = await prisma.user.upsert({
    where: { email: 'seller@example.com' },
    update: { isAdmin: true },
    create: {
      email: 'seller@example.com',
      trustScore: 4.8,
      isAdmin: true,
    },
  });

  const phones = [
    'سامسونج S23 الترا',
    'ايفون 14 برو ماكس',
    'شاومي ريدمي نوت 12',
    'بوكو X5 برو',
    'ايفون 13 عادي',
    'سامسونج A54',
    'ايفون 11 بطارية 90',
  ];

  console.log(`✅ تم إعداد التصنيفات والمستخدم الأساسي بنجاح!`);

  console.log('💎 جاري إنشاء منتجات الترقية...');
  const promotionProducts = [
    { type: 'TOP_PLACEMENT', durationDays: 1, priceSYP: 15000, label: 'تثبيت يوم واحد', discountPercent: 0 },
    { type: 'TOP_PLACEMENT', durationDays: 7, priceSYP: 85000, label: 'تثبيت أسبوع (توفير 20%)', discountPercent: 20 },
    { type: 'TOP_PLACEMENT', durationDays: 30, priceSYP: 300000, label: 'تثبيت شهر كامل (توفير 35%)', discountPercent: 35 },

    { type: 'FEATURED', durationDays: 7, priceSYP: 45000, label: 'تميز أسبوعي', discountPercent: 0 },
    { type: 'FEATURED', durationDays: 30, priceSYP: 150000, label: 'تميز شهري (توفير 15%)', discountPercent: 15 },

    { type: 'URGENT', durationDays: 3, priceSYP: 10000, label: 'عاجل (3 أيام)', discountPercent: 0 },
  ];

  for (const p of promotionProducts) {
    await prisma.promotionProduct.upsert({
      where: {
        type_durationDays: {
          type: p.type as any,
          durationDays: p.durationDays
        }
      },
      update: p as any,
      create: p as any,
    });
  }

  console.log('⚙️ جاري ضبط إعدادات المنصة...');
  await prisma.platformSetting.upsert({
    where: { key: 'EUR_TO_SYP_RATE' },
    update: { value: '13500' },
    create: { key: 'EUR_TO_SYP_RATE', value: '13500' },
  });

  console.log('✨ تم اكتمال زراعة كافة البيانات بنجاح!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
