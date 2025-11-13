import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { HomePageSectionType } from '@prisma/client';
import { CreateHomePageSectionDto } from './dto/create-home-page-section.dto';
import { UpdateHomePageSectionDto } from './dto/update-home-page-section.dto';
import { AddSectionItemDto } from './dto/add-section-item.dto';
import { UpdateSectionItemDto } from './dto/update-section-item.dto';

@Injectable()
export class HomePageService {
  constructor(private prisma: PrismaService) {}

  // Получить все секции (для админа)
  async getAllSections() {
    return this.prisma.homePageSection.findMany({
      include: {
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                image: true,
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  // Получить активные секции (для пользователей)
  async getActiveSections() {
    return this.prisma.homePageSection.findMany({
      where: {
        isActive: true,
      },
      include: {
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                image: true,
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        order: 'asc',
      },
    });
  }

  // Получить секцию по типу (первую найденную)
  async getSectionByType(type: HomePageSectionType) {
    return this.prisma.homePageSection.findFirst({
      where: { type },
      include: {
        items: {
          include: {
            category: {
              select: {
                id: true,
                name: true,
                slug: true,
                image: true,
              },
            },
            service: {
              select: {
                id: true,
                name: true,
                slug: true,
                price: true,
                image: true,
                category: {
                  select: {
                    slug: true,
                  },
                },
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  // Создать секцию
  async createSection(dto: CreateHomePageSectionDto) {
    return this.prisma.homePageSection.create({
      data: {
        type: dto.type,
        title: dto.title,
        icon: dto.icon,
        isActive: dto.isActive ?? true,
        order: dto.order ?? 0,
      },
      include: {
        items: true,
      },
    });
  }

  // Обновить секцию
  async updateSection(sectionId: string, dto: UpdateHomePageSectionDto) {
    const section = await this.prisma.homePageSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Секция не найдена');
    }

    return this.prisma.homePageSection.update({
      where: { id: sectionId },
      data: dto,
      include: {
        items: {
          include: {
            category: true,
            service: true,
          },
          orderBy: {
            order: 'asc',
          },
        },
      },
    });
  }

  // Добавить элемент в секцию
  async addSectionItem(sectionId: string, dto: AddSectionItemDto) {
    const section = await this.prisma.homePageSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Секция не найдена');
    }

    if (!dto.categoryId && !dto.serviceId) {
      throw new BadRequestException('Необходимо указать categoryId или serviceId');
    }

    if (dto.categoryId && dto.serviceId) {
      throw new BadRequestException('Нельзя указать одновременно categoryId и serviceId');
    }

    // Проверяем, что категория или услуга существует
    if (dto.categoryId) {
      const category = await this.prisma.serviceCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Категория не найдена');
      }
    }

    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({
        where: { id: dto.serviceId },
      });
      if (!service) {
        throw new NotFoundException('Услуга не найдена');
      }
    }

    return this.prisma.homePageSectionItem.create({
      data: {
        sectionId,
        categoryId: dto.categoryId,
        serviceId: dto.serviceId,
        imageUrl: dto.imageUrl,
        order: dto.order ?? 0,
      },
      include: {
        category: true,
        service: {
          include: {
            category: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  // Обновить элемент секции
  async updateSectionItem(itemId: string, dto: UpdateSectionItemDto) {
    const item = await this.prisma.homePageSectionItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Элемент секции не найден');
    }

    if (dto.categoryId && dto.serviceId) {
      throw new BadRequestException('Нельзя указать одновременно categoryId и serviceId');
    }

    return this.prisma.homePageSectionItem.update({
      where: { id: itemId },
      data: {
        categoryId: dto.categoryId !== undefined ? dto.categoryId : item.categoryId,
        serviceId: dto.serviceId !== undefined ? dto.serviceId : item.serviceId,
        imageUrl: dto.imageUrl !== undefined ? dto.imageUrl : item.imageUrl,
        order: dto.order !== undefined ? dto.order : item.order,
      },
      include: {
        category: true,
        service: {
          include: {
            category: {
              select: {
                slug: true,
              },
            },
          },
        },
      },
    });
  }

  // Удалить элемент секции
  async removeSectionItem(itemId: string) {
    const item = await this.prisma.homePageSectionItem.findUnique({
      where: { id: itemId },
    });

    if (!item) {
      throw new NotFoundException('Элемент секции не найден');
    }

    await this.prisma.homePageSectionItem.delete({
      where: { id: itemId },
    });

    return { success: true };
  }

  // Удалить секцию
  async deleteSection(sectionId: string) {
    const section = await this.prisma.homePageSection.findUnique({
      where: { id: sectionId },
    });

    if (!section) {
      throw new NotFoundException('Секция не найдена');
    }

    await this.prisma.homePageSection.delete({
      where: { id: sectionId },
    });

    return { success: true };
  }
}


