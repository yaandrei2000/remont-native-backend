import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Создаем категории услуг (корневые категории)
  // Используем findFirst + create, так как составной уникальный индекс с null не поддерживается в where
  let plumbingCategory = await prisma.serviceCategory.findFirst({
    where: { slug: 'plumbing', parentId: null },
  });
  if (!plumbingCategory) {
    plumbingCategory = await prisma.serviceCategory.create({
      data: {
        name: 'Сантехник',
        slug: 'plumbing',
        description: 'Услуги сантехника',
        icon: 'wrench',
        image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
        parentId: null, // Корневая категория
      },
    });
  }

  let electricalCategory = await prisma.serviceCategory.findFirst({
    where: { slug: 'electrical', parentId: null },
  });
  if (!electricalCategory) {
    electricalCategory = await prisma.serviceCategory.create({
      data: {
        name: 'Электрик',
        slug: 'electrical',
        description: 'Услуги электрика',
        icon: 'zap',
        image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
        parentId: null, // Корневая категория
      },
    });
  }

  let appliancesCategory = await prisma.serviceCategory.findFirst({
    where: { slug: 'appliances', parentId: null },
  });
  if (!appliancesCategory) {
    appliancesCategory = await prisma.serviceCategory.create({
      data: {
        name: 'Ремонт техники',
        slug: 'appliances',
        description: 'Ремонт бытовой техники',
        icon: 'wrench',
        image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
        parentId: null, // Корневая категория
      },
    });
  }

  let laptopCategory = await prisma.serviceCategory.findFirst({
    where: { slug: 'laptop', parentId: null },
  });
  if (!laptopCategory) {
    laptopCategory = await prisma.serviceCategory.create({
      data: {
        name: 'Ноутбук',
        slug: 'laptop',
        description: 'Ремонт ноутбуков',
        icon: 'laptop',
        image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/laptop.jpeg',
        parentId: null, // Корневая категория
      },
    });
  }

  let airConditioningCategory = await prisma.serviceCategory.findFirst({
    where: { slug: 'air-conditioning', parentId: null },
  });
  if (!airConditioningCategory) {
    airConditioningCategory = await prisma.serviceCategory.create({
      data: {
        name: 'Кондиционер',
        slug: 'air-conditioning',
        description: 'Ремонт и установка кондиционеров',
        icon: 'air-vent',
        image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/air-conditioning.jpeg',
        parentId: null, // Корневая категория
      },
    });
  }

  let coffeeMachineCategory = await prisma.serviceCategory.findFirst({
    where: { slug: 'coffee-machine', parentId: null },
  });
  if (!coffeeMachineCategory) {
    coffeeMachineCategory = await prisma.serviceCategory.create({
      data: {
        name: 'Кофемашина',
        slug: 'coffee-machine',
        description: 'Ремонт и обслуживание кофемашин',
        icon: 'coffee',
        image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/coffee-machine.jpeg',
        parentId: null, // Корневая категория
      },
    });
  }

  // Создаем подкатегории для примера (подкатегории сантехника)
  let sinkSubcategory = await prisma.serviceCategory.findFirst({
    where: { slug: 'sink', parentId: plumbingCategory.id },
  });
  if (!sinkSubcategory) {
    sinkSubcategory = await prisma.serviceCategory.create({
      data: {
        name: 'Раковина',
        slug: 'sink',
        description: 'Услуги по ремонту и установке раковин',
        icon: 'droplet',
        parentId: plumbingCategory.id, // Подкатегория сантехника
      },
    });
  }

  let toiletSubcategory = await prisma.serviceCategory.findFirst({
    where: { slug: 'toilet', parentId: plumbingCategory.id },
  });
  if (!toiletSubcategory) {
    toiletSubcategory = await prisma.serviceCategory.create({
      data: {
        name: 'Унитаз',
        slug: 'toilet',
        description: 'Услуги по ремонту и установке унитазов',
        icon: 'droplet',
        parentId: plumbingCategory.id, // Подкатегория сантехника
      },
    });
  }

  // Создаем услуги для корневой категории сантехника
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

  // Создаем услуги для подкатегории "Раковина"
  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: sinkSubcategory.id, slug: 'install-siphon' } },
    update: {},
    create: {
      name: 'Установить сифон',
      slug: 'install-siphon',
      description: 'Установка и замена сифона под раковиной',
      price: 1500,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
      time: '30-60 мин',
      categoryId: sinkSubcategory.id,
    },
  });

  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: sinkSubcategory.id, slug: 'replace-faucet' } },
    update: {},
    create: {
      name: 'Заменить смеситель',
      slug: 'replace-faucet',
      description: 'Замена смесителя на раковине',
      price: 2000,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
      time: '1-2 часа',
      categoryId: sinkSubcategory.id,
    },
  });

  // Создаем услуги для подкатегории "Унитаз"
  await prisma.service.upsert({
    where: { categoryId_slug: { categoryId: toiletSubcategory.id, slug: 'install-toilet' } },
    update: {},
    create: {
      name: 'Установить унитаз',
      slug: 'install-toilet',
      description: 'Установка нового унитаза с подключением',
      price: 3500,
      image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/electrical.jpeg',
      time: '2-3 часа',
      categoryId: toiletSubcategory.id,
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

  // Создаем пользователей с разными ролями
  const adminUser = await prisma.user.upsert({
    where: { phone: '+7 999 999-99-96' },
    update: {},
    create: {
      phone: '+7 999 999-99-96',
      firstName: 'Админ',
      lastName: 'Админов',
      email: 'admin@example.com',
      role: 'ADMIN',
      isActive: true,
      points: 0,
      cityId: cities[0].id, // Владимир
    },
  });

  const masterUser = await prisma.user.upsert({
    where: { phone: '+7 999 999-99-99' },
    update: {},
    create: {
      phone: '+7 999 999-99-99',
      firstName: 'Алексей',
      lastName: 'Мастеров',
      email: 'master@example.com',
      role: 'MASTER',
      rating: 4.8,
      reviewsCount: 25,
      isActive: true,
      points: 500,
      cityId: cities[0].id, // Владимир
    },
  });

  const clientUser = await prisma.user.upsert({
    where: { phone: '+7 961 258-41-30' },
    update: {},
    create: {
      phone: '+7 961 258-41-30',
      firstName: 'Иван',
      lastName: 'Клиентов',
      email: 'client@example.com',
      role: 'CLIENT',
      isActive: true,
      points: 200,
      cityId: cities[0].id, // Владимир
    },
  });

  const clientUser2 = await prisma.user.upsert({
    where: { phone: '+7 904 594-30-26' },
    update: {},
    create: {
      phone: '+7 904 594-30-26',
      firstName: 'Мария',
      lastName: 'Петрова',
      email: 'client2@example.com',
      role: 'CLIENT',
      isActive: true,
      points: 100,
      cityId: cities[1].id, // Москва
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

  // Создаем секции главной страницы
  // 1. Quick Services (Быстрые услуги - категории)
  let quickServicesSection = await prisma.homePageSection.findFirst({
    where: { type: 'QUICK_SERVICES' },
  });
  if (!quickServicesSection) {
    quickServicesSection = await prisma.homePageSection.create({
      data: {
        type: 'QUICK_SERVICES',
        title: null,
        isActive: true,
        order: 1,
      },
    });
  }

  // Добавляем категории в Quick Services
  await prisma.homePageSectionItem.upsert({
    where: {
      id: 'quick-services-1',
    },
    update: {},
    create: {
      id: 'quick-services-1',
      sectionId: quickServicesSection.id,
      categoryId: laptopCategory.id,
      order: 0,
    },
  });

  await prisma.homePageSectionItem.upsert({
    where: {
      id: 'quick-services-2',
    },
    update: {},
    create: {
      id: 'quick-services-2',
      sectionId: quickServicesSection.id,
      categoryId: airConditioningCategory.id,
      order: 1,
    },
  });

  await prisma.homePageSectionItem.upsert({
    where: {
      id: 'quick-services-3',
    },
    update: {},
    create: {
      id: 'quick-services-3',
      sectionId: quickServicesSection.id,
      categoryId: coffeeMachineCategory.id,
      order: 2,
    },
  });

  await prisma.homePageSectionItem.upsert({
    where: {
      id: 'quick-services-4',
    },
    update: {},
    create: {
      id: 'quick-services-4',
      sectionId: quickServicesSection.id,
      categoryId: appliancesCategory.id,
      order: 3,
    },
  });

  // 2. Service Categories (Категории услуг)
  let serviceCategoriesSection = await prisma.homePageSection.findFirst({
    where: { type: 'SERVICE_CATEGORIES' },
  });
  if (!serviceCategoriesSection) {
    serviceCategoriesSection = await prisma.homePageSection.create({
      data: {
        type: 'SERVICE_CATEGORIES',
        title: null,
        isActive: true,
        order: 2,
      },
    });
  }

  // Добавляем все категории в Service Categories
  const allCategories = [
    plumbingCategory,
    electricalCategory,
    appliancesCategory,
    laptopCategory,
    airConditioningCategory,
    coffeeMachineCategory,
  ];

  for (let i = 0; i < allCategories.length; i++) {
    await prisma.homePageSectionItem.upsert({
      where: {
        id: `service-categories-${i + 1}`,
      },
      update: {},
      create: {
        id: `service-categories-${i + 1}`,
        sectionId: serviceCategoriesSection.id,
        categoryId: allCategories[i].id,
        order: i,
      },
    });
  }

  // 3. Seasonal Services (Сезонные услуги)
  let seasonalServicesSection = await prisma.homePageSection.findFirst({
    where: { type: 'SEASONAL_SERVICES' },
  });
  if (!seasonalServicesSection) {
    seasonalServicesSection = await prisma.homePageSection.create({
      data: {
        type: 'SEASONAL_SERVICES',
        title: 'Часто заказывают осенью',
        icon: 'https://images.unsplash.com/photo-1621905251918-48416bd8575a?w=48&h=48&fit=crop',
        isActive: true,
        order: 3,
      },
    });
  }

  // Получаем услуги для сезонных услуг
  const radiatorRepair = await prisma.service.findUnique({
    where: { categoryId_slug: { categoryId: plumbingCategory.id, slug: 'radiator-repair' } },
  });

  const osUpdate = await prisma.service.findUnique({
    where: { categoryId_slug: { categoryId: laptopCategory.id, slug: 'os-update' } },
  });

  const boilerInstallation = await prisma.service.findUnique({
    where: { categoryId_slug: { categoryId: plumbingCategory.id, slug: 'boiler-installation' } },
  });

  // Добавляем услуги в Seasonal Services
  if (radiatorRepair) {
    await prisma.homePageSectionItem.upsert({
      where: {
        id: 'seasonal-services-1',
      },
      update: {},
      create: {
        id: 'seasonal-services-1',
        sectionId: seasonalServicesSection.id,
        serviceId: radiatorRepair.id,
        order: 0,
      },
    });
  }

  if (osUpdate) {
    await prisma.homePageSectionItem.upsert({
      where: {
        id: 'seasonal-services-2',
      },
      update: {},
      create: {
        id: 'seasonal-services-2',
        sectionId: seasonalServicesSection.id,
        serviceId: osUpdate.id,
        order: 1,
      },
    });
  }

  if (boilerInstallation) {
    await prisma.homePageSectionItem.upsert({
      where: {
        id: 'seasonal-services-3',
      },
      update: {},
      create: {
        id: 'seasonal-services-3',
        sectionId: seasonalServicesSection.id,
        serviceId: boilerInstallation.id,
        order: 2,
      },
    });
  }

  // // Создаем истории (Stories)
  // const story1 = await prisma.story.create({
  //   data: {
  //     title: 'Встречайте обновленный ФастСервис',
  //     image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/story1-preview.jpeg',
  //     isActive: true,
  //     order: 0,
  //     images: {
  //       create: [
  //         {
  //           image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=800&fit=crop',
  //           title: 'Встречайте обновленный ФастСервис',
  //           duration: 15000,
  //           order: 0,
  //         },
  //         {
  //           image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=800&fit=crop',
  //           title: 'Новые возможности сервиса',
  //           duration: 15000,
  //           order: 1,
  //         },
  //         {
  //           image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=800&fit=crop',
  //           title: 'Улучшенный интерфейс',
  //           duration: 15000,
  //           order: 2,
  //         },
  //       ],
  //     },
  //   },
  // });

  // const story2 = await prisma.story.create({
  //   data: {
  //     title: 'Дарим 500 рублей!',
  //     image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/story2-preview.jpeg',
  //     isActive: true,
  //     order: 1,
  //     images: {
  //       create: [
  //         {
  //           image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=800&fit=crop',
  //           title: 'Дарим 500 рублей!',
  //           duration: 15000,
  //           order: 0,
  //         },
  //         {
  //           image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=800&fit=crop',
  //           title: 'За каждого друга',
  //           duration: 15000,
  //           order: 1,
  //         },
  //         {
  //           image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=800&fit=crop',
  //           title: 'И вам, и другу',
  //           duration: 15000,
  //           order: 2,
  //         },
  //       ],
  //     },
  //   },
  // });

  // const story3 = await prisma.story.create({
  //   data: {
  //     title: 'Через час мастер у вас',
  //     image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/story3-preview.jpeg',
  //     isActive: true,
  //     order: 2,
  //     images: {
  //       create: [
  //         {
  //           image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=800&fit=crop',
  //           title: 'Через час мастер у вас',
  //           duration: 15000,
  //           order: 0,
  //         },
  //         {
  //           image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=800&fit=crop',
  //           title: 'Быстрое обслуживание',
  //           duration: 15000,
  //           order: 1,
  //         },
  //       ],
  //     },
  //   },
  // });

  // const story4 = await prisma.story.create({
  //   data: {
  //     title: 'Кэшбэк за заказы',
  //     image: 'https://s3.twcstorage.ru/c15740f7-42d08c8e-3fac-4d3e-a51e-25c768ace9ff/remont/story4-preview.jpeg',
  //     isActive: true,
  //     order: 3,
  //     images: {
  //       create: [
  //         {
  //           image: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=400&h=800&fit=crop',
  //           title: 'Кэшбэк за заказы',
  //           duration: 15000,
  //           order: 0,
  //         },
  //         {
  //           image: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400&h=800&fit=crop',
  //           title: '10% с каждого заказа',
  //           duration: 15000,
  //           order: 1,
  //         },
  //         {
  //           image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=800&fit=crop',
  //           title: 'Накопительные баллы',
  //           duration: 15000,
  //           order: 2,
  //         },
  //       ],
  //     },
  //   },
  // });

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



