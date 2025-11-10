import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class ServicesService {
  constructor(private prisma: PrismaService) {}

  async getCategories() {
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

  async getServicesByCategory(categorySlug: string, pagination: PaginationDto) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where: { categoryId: category.id },
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      }),
      this.prisma.service.count({
        where: { categoryId: category.id },
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

  async searchServices(query: string, pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
        include: {
          category: true,
        },
        skip,
        take: limit,
      }),
      this.prisma.service.count({
        where: {
          OR: [
            { name: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
          ],
        },
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

  async getService(categorySlug: string, serviceSlug: string) {
    // Сначала находим категорию
    const category = await this.prisma.serviceCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Затем находим услугу в этой категории
    const service = await this.prisma.service.findFirst({
      where: {
        slug: serviceSlug,
        categoryId: category.id,
      },
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



