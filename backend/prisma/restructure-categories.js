const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function upsertCat({ slug, nameAr, order, parentId = null, icon }) {
  return prisma.category.upsert({
    where: { slug },
    update: { nameAr, order, parentId, ...(icon ? { icon } : {}) },
    create: { slug, nameAr, nameEn: slug, order, parentId, ...(icon ? { icon } : {}) },
  });
}

async function main() {
  const vehicles = await upsertCat({ slug: 'cars', nameAr: 'مركبات', order: 2 });
  console.log('✅ مركبات:', vehicles.id);

  const bicycles = await upsertCat({
    slug: 'cars-bicycles', nameAr: 'دراجات هوائية', order: 5, parentId: vehicles.id,
  });
  console.log('✅ دراجات هوائية:', bicycles.id);

  const beauty = await upsertCat({
    slug: 'beauty', nameAr: 'مكياج وعناية', order: 6,
    icon: 'http://localhost:3000/uploads/categories/beauty.png',
  });
  console.log('✅ مكياج وعناية:', beauty.id);

  const beautySubs = [
    { slug: 'beauty-makeup', nameAr: 'مكياج', order: 1 },
    { slug: 'beauty-perfumes', nameAr: 'عطور', order: 2 },
    { slug: 'beauty-skincare', nameAr: 'العناية بالبشرة', order: 3 },
    { slug: 'beauty-haircare', nameAr: 'العناية بالشعر', order: 4 },
    { slug: 'beauty-devices', nameAr: 'أجهزة تجميل', order: 5 },
  ];
  const subIds = {};
  for (const s of beautySubs) {
    const c = await upsertCat({ ...s, parentId: beauty.id });
    subIds[s.slug] = c.id;
  }
  console.log('✅ أقسام المكياج الفرعية جاهزة');

  await upsertCat({ slug: 'services', nameAr: 'خدمات', order: 7 });
  await upsertCat({ slug: 'other', nameAr: 'أخرى', order: 8 });

  const makeupMove = await prisma.listing.updateMany({
    where: { id: '664d4c94-6516-455e-8304-d6c44b215b32' },
    data: { categoryId: subIds['beauty-makeup'] },
  });
  console.log('🔁 نقل شنطة المكياج → مكياج:', makeupMove.count);

  const bikeMove = await prisma.listing.updateMany({
    where: { id: '26e3e9a0-bd38-40d0-87bb-dd22e5b31543' },
    data: { categoryId: bicycles.id },
  });
  console.log('🔁 نقل الدراجة الهوائية → دراجات هوائية:', bikeMove.count);

  console.log('✨ تمت إعادة الهيكلة بنجاح.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
