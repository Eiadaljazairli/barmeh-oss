"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const ar_1 = require("@faker-js/faker/locale/ar");
const prisma = new client_1.PrismaClient();
async function main() {
    console.log('🌱 جاري بدء زراعة البيانات (Seeding)...');
    await prisma.listing.deleteMany();
    await prisma.category.deleteMany();
    const categoriesData = [
        { slug: 'realestate', nameAr: 'عقارات', icon: '🏠', order: 1, parentId: null },
        { slug: 'cars', nameAr: 'سيارات', icon: '🚗', order: 2, parentId: null },
        { slug: 'electronics', nameAr: 'إلكترونيات', icon: '📱', order: 3, parentId: null },
        { slug: 'furniture', nameAr: 'أثاث', icon: '🛋️', order: 4, parentId: null },
        { slug: 'clothing', nameAr: 'ملبوسات', icon: '👕', order: 5, parentId: null },
        { slug: 'services', nameAr: 'خدمات', icon: '🛠️', order: 6, parentId: null },
        { slug: 'other', nameAr: 'أخرى', icon: '🛍️', order: 7, parentId: null },
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
    const subcategoriesMap = {
        realestate: [
            { slug: 'realestate-apartments-sell', nameAr: 'شقق للبيع', icon: '🏠', order: 1 },
            { slug: 'realestate-apartments-rent', nameAr: 'شقق للايجار', icon: '🔑', order: 2 },
            { slug: 'realestate-villas', nameAr: 'فيلات وقصور', icon: '🏰', order: 3 },
            { slug: 'realestate-offices', nameAr: 'مكاتب وعيادات', icon: '🩺', order: 4 },
            { slug: 'realestate-shops', nameAr: 'محلات ومخازن', icon: '🏪', order: 5 },
            { slug: 'realestate-land', nameAr: 'أراضي ومزارع', icon: '🌄', order: 6 },
            { slug: 'realestate-commercial-other', nameAr: 'عقارات تجارية أخرى', icon: '🏢', order: 7 },
        ],
        cars: [
            { slug: 'cars-sedan', nameAr: 'سيارات سياحية', icon: '🚗', order: 1 },
            { slug: 'cars-suv', nameAr: 'سيارات دفع رباعي', icon: '🚙', order: 2 },
            { slug: 'cars-parts', nameAr: 'قطع غيار واكسسوارات', icon: '🔧', order: 3 },
            { slug: 'cars-bikes', nameAr: 'دراجات نارية', icon: '🏍️', order: 4 },
            { slug: 'cars-trucks', nameAr: 'شاحنات ومعدات ثقيلة', icon: '🚚', order: 5 },
            { slug: 'cars-maintenance', nameAr: 'صيانة وزيوت', icon: '🛢️', order: 6 },
        ],
        electronics: [
            { slug: 'mobiles', nameAr: 'موبايلات', icon: '📲', order: 1 },
            { slug: 'mobiles-accessories', nameAr: 'اكسسوارات موبايل', icon: '🎧', order: 2 },
            { slug: 'electronics-laptops', nameAr: 'لابتوب وكمبيوتر', icon: '💻', order: 3 },
            { slug: 'electronics-tablets', nameAr: 'تابلت وايباد', icon: '📟', order: 4 },
            { slug: 'electronics-gaming', nameAr: 'بلايستيشن وألعاب', icon: '🎮', order: 5 },
            { slug: 'electronics-tvs', nameAr: 'تلفزيونات وشاشات', icon: '📺', order: 6 },
            { slug: 'electronics-cameras', nameAr: 'كاميرات وتصوير', icon: '📷', order: 7 },
        ],
        furniture: [
            { slug: 'furniture-bedroom', nameAr: 'غرف نوم', icon: '🛏️', order: 1 },
            { slug: 'furniture-living', nameAr: 'غرف جلوس وصالونات', icon: '🛋️', order: 2 },
            { slug: 'furniture-kitchen', nameAr: 'مطابخ وأدواتها', icon: '🍽️', order: 3 },
            { slug: 'furniture-appliances', nameAr: 'غسالات وبرادات', icon: '❄️', order: 4 },
            { slug: 'furniture-rugs', nameAr: 'سجاد ومفروشات', icon: '🧶', order: 5 },
            { slug: 'furniture-decor', nameAr: 'ديكور وإنارة', icon: '💡', order: 6 },
        ],
        clothing: [
            { slug: 'clothing-men', nameAr: 'ملابس رجالية', icon: '👔', order: 1 },
            { slug: 'clothing-women', nameAr: 'ملابس نسائية', icon: '👗', order: 2 },
            { slug: 'clothing-kids', nameAr: 'ملابس أطفال', icon: '👶', order: 3 },
            { slug: 'clothing-shoes', nameAr: 'أحذية', icon: '👟', order: 4 },
            { slug: 'clothing-watches', nameAr: 'ساعات ومجوهرات', icon: '⌚', order: 5 },
            { slug: 'clothing-bags', nameAr: 'حقائب واكسسوارات', icon: '👜', order: 6 },
        ],
        services: [
            { slug: 'services-maintenance', nameAr: 'صيانة منزلية', icon: '🔨', order: 1 },
            { slug: 'services-moving', nameAr: 'نقل عفش وتوصيل', icon: '📦', order: 2 },
            { slug: 'services-education', nameAr: 'تعليم ودروس خصوصية', icon: '📚', order: 3 },
            { slug: 'services-medical', nameAr: 'خدمات طبية', icon: '🏥', order: 4 },
            { slug: 'services-it', nameAr: 'برمجة وتصميم', icon: '💻', order: 5 },
            { slug: 'services-events', nameAr: 'حفلات ومناسبات', icon: '🎈', order: 6 },
        ],
        other: [
            { slug: 'other-pets', nameAr: 'حيوانات أليفة', icon: '🐾', order: 1 },
            { slug: 'other-books', nameAr: 'كتب ومستلزمات دراسية', icon: '📖', order: 2 },
            { slug: 'other-sports', nameAr: 'رياضة ولياقة بدنية', icon: '⚽', order: 3 },
            { slug: 'other-music', nameAr: 'آلات موسيقية', icon: '🎸', order: 4 },
            { slug: 'other-tools', nameAr: 'عدد وأدوات صناعية', icon: '🛠️', order: 5 },
            { slug: 'other-plants', nameAr: 'نباتات ومستلزمات حدائق', icon: '🌵', order: 6 },
        ],
    };
    for (const parent of categories) {
        const subs = subcategoriesMap[parent.slug];
        if (!subs)
            continue;
        for (const sub of subs) {
            await prisma.category.upsert({
                where: { slug: sub.slug },
                update: { parentId: parent.id, nameAr: sub.nameAr, icon: sub.icon, order: sub.order },
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
        where: { phone: '+963999999999' },
        update: {},
        create: {
            phone: '+963999999999',
            trustScore: 4.8,
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
    const mobilesCategory = await prisma.category.findUnique({ where: { slug: 'mobiles' } });
    if (mobilesCategory) {
        console.log('📱 جاري إدخال 50 إعلان موبايلات موزعة على المحافظات...');
        const allCities = Object.values(client_1.City);
        const listingsData = [];
        for (let i = 0; i < 50; i++) {
            const randomPhone = phones[Math.floor(Math.random() * phones.length)];
            const randomPrice = ar_1.faker.number.int({ min: 2000000, max: 18000000 });
            const randomDate = ar_1.faker.date.recent({ days: 7 });
            const randomCity = allCities[Math.floor(Math.random() * allCities.length)];
            listingsData.push({
                userId: seller.id,
                title: `${randomPhone} - للبيع في ${randomCity}`,
                description: `موبايل ${randomPhone} مستعمل نظيف جداً. السعر قابل للتفاوض البسيط. \n\n للتواصل المباشر عبر الشات.`,
                price: randomPrice,
                city: randomCity,
                categoryId: mobilesCategory.id,
                status: 'ACTIVE',
                createdAt: randomDate,
                updatedAt: randomDate,
            });
        }
        await prisma.listing.createMany({
            data: listingsData,
        });
        console.log(`✅ تم زراعة ${listingsData.length} إعلان بنجاح في كافة المحافظات!`);
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
