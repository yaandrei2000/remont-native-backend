import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async getCategories(cityId?: string) {
    // Если указан город, показываем только категории, у которых есть услуги в этом городе
    if (cityId) {
      const categoriesWithServices = await this.prisma.serviceCategory.findMany({
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
            },
          },
        },
        orderBy: {
          name: 'asc',
        },
      });
      return categoriesWithServices;
    }

    // Если город не указан, возвращаем все категории
    return this.prisma.serviceCategory.findMany({
      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getServicesByCategory(categorySlug: string, pagination: PaginationDto, cityId?: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Формируем условие для фильтрации по городу
    const whereCondition: any = { categoryId: category.id };
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
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.service.count({
        where: whereCondition,
      }),
    ]);

    return {
      category,
      services,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
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

  async getService(categorySlug: string, serviceSlug: string, cityId?: string) {
    // Сначала находим категорию
    const category = await this.prisma.serviceCategory.findUnique({
      where: { slug: categorySlug },
    });

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
        category: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }
}



