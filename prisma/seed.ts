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
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
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
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
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
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
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
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/laptop.jpeg',
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
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/air-conditioning.jpeg',
    },
  });

  const coffeeMachineCategory = await prisma.serviceCategory.upsert({
    where: { slug: 'coffee-machine' },
    update: {},
    create: {
      name: 'Кофемашина',
      slug: 'coffee-machine',
      description: 'Ремонт и обслуживание кофемашин',
      icon: 'coffee',
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/coffee-machine.jpeg',
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
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/air-conditioning.jpeg',
      time: '2-3 часа',
      categoryId: plumbingCategory.id,
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
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/air-conditioning.jpeg',
      time: '3-4 часа',
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
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/screen-repair.jpeg',
      time: '1-2 часа',
      categoryId: laptopCategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: laptopCategory.id, slug: 'data-recovery' } },
    update: {},
    create: {
      name: 'Восстановление данных',
      slug: 'data-recovery',
      description: 'Профессиональное восстановление удаленных файлов, поврежденных данных и информации с неисправных накопителей.',
      price: 1500,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/data-recovery.jpeg',
      time: '1-3 дня',
      categoryId: laptopCategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: laptopCategory.id, slug: 'screen-repair' } },
    update: {},
    create: {
      name: 'Ремонт экрана',
      slug: 'screen-repair',
      description: 'Замена матрицы ноутбука, ремонт дисплея и устранение проблем с изображением.',
      price: 3000,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/screen-repair.jpeg',
      time: '1 день',
      categoryId: laptopCategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: laptopCategory.id, slug: 'keyboard-repair' } },
    update: {},
    create: {
      name: 'Ремонт клавиатуры',
      slug: 'keyboard-repair',
      description: 'Замена клавиш и ремонт клавиатуры',
      price: 2000,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/keyboard-repair.jpeg',
      time: '1 день',
      categoryId: laptopCategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: electricalCategory.id, slug: 'outlet-repair' } },
    update: {},
    create: {
      name: 'Ремонт розеток',
      slug: 'outlet-repair',
      description: 'Замена и ремонт электрических розеток',
      price: 500,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
      time: '30 мин',
      categoryId: electricalCategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: appliancesCategory.id, slug: 'washing-machine' } },
    update: {},
    create: {
      name: 'Стиральная машина',
      slug: 'washing-machine',
      description: 'Ремонт стиральных машин',
      price: 2000,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
      time: '1-2 часа',
      categoryId: appliancesCategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: airConditioningCategory.id, slug: 'ac-installation' } },
    update: {},
    create: {
      name: 'Установка кондиционера',
      slug: 'ac-installation',
      description: 'Монтаж и подключение кондиционера',
      price: 5000,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
      time: '2-3 часа',
      categoryId: airConditioningCategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: coffeeMachineCategory.id, slug: 'coffee-repair' } },
    update: {},
    create: {
      name: 'Ремонт кофемашины',
      slug: 'coffee-repair',
      description: 'Диагностика и ремонт кофемашин',
      price: 1500,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
      time: '1-2 часа',
      categoryId: coffeeMachineCategory.id,
    },
  });

  // Создаем города
  const citiesData = [
    { name: 'Владимир', region: 'Владимирская область' },
    { name: 'Москва', region: 'Московская область' },
  ];

  const cities: { id: string; name: string }[] = [];
  for (const cityData of citiesData) {
    const city = await prisma.city.upsert({
      where: { name: cityData.name },
      update: {},
      create: {
        name: cityData.name,
        region: cityData.region,
        isActive: true,
      },
    });
    cities.push({ id: city.id, name: city.name });
  }

  // Получаем все созданные услуги
  const allServices = await prisma.service.findMany();

  // Связываем все услуги с обоими городами
  for (const service of allServices) {
    for (const city of cities) {
      await prisma.serviceCity.upsert({
        where: {
          serviceId_cityId: {
            serviceId: service.id,
            cityId: city.id,
          },
        },
        update: {},
        create: {
          serviceId: service.id,
          cityId: city.id,
        },
      });
    }
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

  // Создаем промокоды
  const promoCode1 = await prisma.promoCode.upsert({
    where: { code: 'WELCOME100' },
    update: {},
    create: {
      code: 'WELCOME100',
      description: '100 баллов за регистрацию',
      points: 100,
      isActive: true,
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



