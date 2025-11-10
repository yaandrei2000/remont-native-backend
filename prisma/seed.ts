import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Создаем категории услуг
  const plumbingCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'plumbing' },
    update: {},
    create: {
      name: 'Сантехник',
      slug: 'plumbing',
      description: 'Услуги сантехника',
      icon: 'wrench',
    },
  });

  const electricalCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'electrical' },
    update: {},
    create: {
      name: 'Электрик',
      slug: 'electrical',
      description: 'Услуги электрика',
      icon: 'zap',
    },
  });

  const appliancesCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'appliances' },
    update: {},
    create: {
      name: 'Ремонт техники',
      slug: 'appliances',
      description: 'Ремонт бытовой техники',
      icon: 'wrench',
    },
  });

  const laptopCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'laptop' },
    update: {},
    create: {
      name: 'Ноутбук',
      slug: 'laptop',
      description: 'Ремонт ноутбуков',
      icon: 'laptop',
    },
  });

  const airConditioningCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'air-conditioning' },
    update: {},
    create: {
      name: 'Кондиционер',
      slug: 'air-conditioning',
      description: 'Ремонт и установка кондиционеров',
      icon: 'air-vent',
    },
  });

  // Создаем услуги
  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: plumbingCategory.id, slug: 'radiator-repair' } },
    update: {},
    create: {
      name: 'Радиатор не греет',
      slug: 'radiator-repair',
      description: 'Диагностика и ремонт радиатора отопления',
      price: 3380,
      categoryId: plumbingCategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: laptopCategory.id, slug: 'os-update' } },
    update: {},
    create: {
      name: 'Обновить операционную систему',
      slug: 'os-update',
      description: 'Обновление и настройка операционной системы',
      price: 1290,
      categoryId: laptopCategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: plumbingCategory.id, slug: 'boiler-installation' } },
    update: {},
    create: {
      name: 'Установка бойлера',
      slug: 'boiler-installation',
      description: 'Установка и подключение водонагревателя',
      price: 2830,
      categoryId: plumbingCategory.id,
    },
  });

  // Создаем города
  const cities = [
    { name: 'Санкт-Петербург', region: 'Ленинградская область' },
    { name: 'Астрахань', region: 'Астраханская область' },
    { name: 'Архангельск', region: 'Архангельская область' },
    { name: 'Белгород', region: 'Белгородская область' },
    { name: 'Барнаул', region: 'Алтайский край' },
    { name: 'Брянск', region: 'Брянская область' },
    { name: 'Воронеж', region: 'Воронежская область' },
    { name: 'Владимир', region: 'Владимирская область' },
    { name: 'Волгоград', region: 'Волгоградская область' },
    { name: 'Екатеринбург', region: 'Свердловская область' },
    { name: 'Иваново', region: 'Ивановская область' },
    { name: 'Казань', region: 'Республика Татарстан' },
    { name: 'Калуга', region: 'Калужская область' },
    { name: 'Краснодар', region: 'Краснодарский край' },
    { name: 'Москва', region: 'Московская область' },
    { name: 'Нижний Новгород', region: 'Нижегородская область' },
    { name: 'Новосибирск', region: 'Новосибирская область' },
    { name: 'Омск', region: 'Омская область' },
    { name: 'Пермь', region: 'Пермский край' },
    { name: 'Ростов-на-Дону', region: 'Ростовская область' },
    { name: 'Самара', region: 'Самарская область' },
    { name: 'Тольятти', region: 'Самарская область' },
    { name: 'Уфа', region: 'Республика Башкортостан' },
    { name: 'Челябинск', region: 'Челябинская область' },
    { name: 'Ярославль', region: 'Ярославская область' },
  ];

  for (const cityData of cities) {
    await prisma.city.upsert({
      where: { name: cityData.name },
      update: {},
      create: {
        name: cityData.name,
        region: cityData.region,
        isActive: true,
      },
    });
  }

  // Создаем тестового мастера (пользователь с ролью MASTER)
  await prisma.user.upsert({
    where: { phone: '+7 (999) 123-45-67' },
    update: {},
    create: {
      phone: '+7 (999) 123-45-67',
      firstName: 'Алексей',
      lastName: 'М.',
      email: 'alexey@example.com',
      role: 'MASTER',
      rating: 5,
      reviewsCount: 10,
      isActive: true,
      points: 0,
    },
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });



