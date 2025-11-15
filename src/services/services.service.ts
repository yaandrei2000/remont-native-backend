import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async getCategories(cityId?: string, parentId?: string) {
    // Если указан parentId, возвращаем подкатегории
    if (parentId) {
      const whereCondition: any = { parentId };
      
      if (cityId) {
        // Фильтруем только те подкатегории, у которых есть услуги в этом городе
        return this.prisma.serviceCategory.findMany({
          where: {
            ...whereCondition,
            services: {
              some: {
                cities: {
                  some: {
                    cityId: cityId,
                  },
                },
              },
            },
          },
          include: {
            _count: {
              select: {
                services: {
                  where: {
                    cities: {
                      some: {
                        cityId: cityId,
                      },
                    },
                  },
                },
                children: true,
              },
            },
          },
          orderBy: {
            name: 'asc',
          },
        });
      }

      return this.prisma.serviceCategory.findMany({
        where: whereCondition,
        include: {
          _count: {
            select: {
              services: true,
              children: true,
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
    }

    // Если указан город, показываем только корневые категории (parentId === null), у которых есть услуги в этом городе
    if (cityId) {
      const categoriesWithServices = await this.prisma.serviceCategory.findMany({
        where: {
          parentId: null, // Только корневые категории
          OR: [
            {
              // Либо у самой категории есть услуги
              services: {
                some: {
                  cities: {
                    some: {
                      cityId: cityId,
                    },
                  },
                },
              },
            },
            {
              // Либо у подкатегорий есть услуги
              children: {
                some: {
                  services: {
                    some: {
                      cities: {
                        some: {
                          cityId: cityId,
                        },
                      },
                    },
                  },
                },
              },
            },
          ],
        },
        include: {
          _count: {
            select: {
              services: {
                where: {
                  cities: {
                    some: {
                      cityId: cityId,
                    },
                  },
                },
              },
              children: {
                where: {
                  services: {
                    some: {
                      cities: {
                        some: {
                          cityId: cityId,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
      return categoriesWithServices;
    }

    // Если город не указан, возвращаем все корневые категории
    return this.prisma.serviceCategory.findMany({
      where: {
        parentId: null, // Только корневые категории
      },
      include: {
        _count: {
          select: {
            services: true,
            children: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getServicesByCategory(categorySlug: string, pagination: PaginationDto, cityId?: string, parentSlug?: string) {
    // Если указан parentSlug, ищем подкатегорию в рамках родительской категории
    let category;
    if (parentSlug) {
      const parentCategory = await this.prisma.serviceCategory.findFirst({
        where: { 
          slug: parentSlug,
          parentId: null, // Родительская категория должна быть корневой
        },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      category = await this.prisma.serviceCategory.findFirst({
        where: { 
          slug: categorySlug,
          parentId: parentCategory.id,
        },
        include: {
          parent: true,
        },
      });
    } else {
      // Ищем категорию по slug (может быть корневой или подкатегорией)
      category = await this.prisma.serviceCategory.findFirst({
        where: { 
          slug: categorySlug,
          parentId: null, // По умолчанию ищем корневую категорию
        },
        include: {
          parent: true,
        },
      });
    }

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Получаем подкатегории и услуги
    const [subcategories, services, servicesTotal] = await Promise.all([
      // Подкатегории
      this.prisma.serviceCategory.findMany({
        where: { parentId: category.id },
        include: {
          _count: {
            select: {
              services: cityId ? {
                where: {
                  cities: {
                    some: {
                      cityId: cityId,
                    },
                  },
                },
              } : true,
            },
          },
        },
        orderBy: { name: 'asc' },
      }),
      // Услуги
      (async () => {
        const whereCondition: any = { categoryId: category.id };
        if (cityId) {
          whereCondition.cities = {
            some: {
              cityId: cityId,
            },
          };
        }
        return this.prisma.service.findMany({
          where: whereCondition,
          skip,
          take: limit,
          orderBy: { name: 'asc' },
        });
      })(),
      // Общее количество услуг
      (async () => {
        const whereCondition: any = { categoryId: category.id };
        if (cityId) {
          whereCondition.cities = {
            some: {
              cityId: cityId,
            },
          };
        }
        return this.prisma.service.count({
          where: whereCondition,
        });
      })(),
    ]);

    return {
      category,
      subcategories,
      services,
      pagination: {
        page,
        limit,
        total: servicesTotal,
        totalPages: Math.ceil(servicesTotal / limit),
      },
    };
  }

  async searchServices(query: string, pagination: PaginationDto, cityId?: string) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Формируем условие для поиска
    const whereCondition: any = {
      OR: [
        { name: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ],
    };

    // Если указан город, фильтруем только услуги доступные в этом городе
    if (cityId) {
      whereCondition.cities = {
        some: {
          cityId: cityId,
        },
      };
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where: whereCondition,
        include: {
          category: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.service.count({
        where: whereCondition,
      }),
    ]);

    return {
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getService(categorySlug: string, serviceSlug: string, cityId?: string, parentSlug?: string) {
    // Если указан parentSlug, ищем подкатегорию в рамках родительской категории
    let category;
    if (parentSlug) {
      const parentCategory = await this.prisma.serviceCategory.findFirst({
        where: { 
          slug: parentSlug,
          parentId: null, // Родительская категория должна быть корневой
        },
      });

      if (!parentCategory) {
        throw new NotFoundException('Parent category not found');
      }

      category = await this.prisma.serviceCategory.findFirst({
        where: { 
          slug: categorySlug,
          parentId: parentCategory.id,
        },
        include: {
          parent: true,
        },
      });
    } else {
      // Ищем категорию по slug (может быть корневой или подкатегорией)
      category = await this.prisma.serviceCategory.findFirst({
        where: { 
          slug: categorySlug,
        },
        include: {
          parent: true,
        },
      });
    }

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Формируем условие для поиска услуги
    const whereCondition: any = {
      slug: serviceSlug,
      categoryId: category.id,
    };

    // Если указан город, проверяем что услуга доступна в этом городе
    if (cityId) {
      whereCondition.cities = {
        some: {
          cityId: cityId,
        },
      };
    }

    // Затем находим услугу в этой категории
    const service = await this.prisma.service.findFirst({
      where: whereCondition,
      include: {
        category: {
          include: {
            parent: true,
          },
        },
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }
}



