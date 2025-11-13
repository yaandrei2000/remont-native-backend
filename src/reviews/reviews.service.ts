import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(userId: string, dto: { orderId: string; rating: number; comment?: string }) {
    // Проверяем, что заказ существует и принадлежит пользователю
    const order = await this.prisma.order.findUnique({
      where: { id: dto.orderId },
      include: {
        items: true,
        client: true,
        master: true,
      },
    });

    if (!order) {
      throw new NotFoundException('Заказ не найден');
    }

    // Проверяем, что заказ принадлежит пользователю
    if (order.clientId !== userId) {
      throw new BadRequestException('Вы можете оставить отзыв только на свои заказы');
    }

    // Проверяем, что заказ завершен
    if (order.status !== 'COMPLETED') {
      throw new BadRequestException('Можно оставить отзыв только на завершенные заказы');
    }

    // Проверяем, что отзыв еще не оставлен
    const existingReview = await this.prisma.review.findUnique({
      where: { orderId: dto.orderId },
    });

    if (existingReview) {
      throw new BadRequestException('Отзыв на этот заказ уже оставлен');
    }

    // Получаем первую услугу из заказа
    if (!order.items || order.items.length === 0) {
      throw new BadRequestException('В заказе нет услуг');
    }

    const firstItem = order.items[0];
    const serviceId = firstItem.serviceId;
    const masterId = order.masterId;

    // Создаем отзыв
    const review = await this.prisma.review.create({
      data: {
        orderId: dto.orderId,
        serviceId,
        authorId: userId,
        masterId: masterId || null,
        rating: dto.rating,
        comment: dto.comment || null,
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        master: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
            rating: true,
            reviewsCount: true,
          },
        },
        service: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Обновляем рейтинг мастера, если он есть
    if (masterId) {
      await this.updateMasterRating(masterId);
    }

    return review;
  }

  async getServiceReviews(serviceId: string, limit = 20, offset = 0) {
    const reviews = await this.prisma.review.findMany({
      where: { serviceId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        master: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            completedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });

    const total = await this.prisma.review.count({
      where: { serviceId },
    });

    // Вычисляем средний рейтинг
    const avgRating = await this.prisma.review.aggregate({
      where: { serviceId },
      _avg: { rating: true },
    });

    return {
      reviews,
      total,
      averageRating: avgRating._avg.rating || 0,
    };
  }

  async getOrderReview(orderId: string) {
    return this.prisma.review.findUnique({
      where: { orderId },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        master: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
      },
    });
  }

  private async updateMasterRating(masterId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { masterId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      return;
    }

    const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

    await this.prisma.user.update({
      where: { id: masterId },
      data: {
        rating: averageRating,
        reviewsCount: reviews.length,
      },
    });
  }

  async getServiceMasters(serviceId: string, cityId?: string) {
    // Получаем всех активных мастеров без фильтрации
    const whereClause: any = {
      role: 'MASTER',
      isActive: true,
    };

    if (cityId) {
      whereClause.cityId = cityId;
    }

    const masters = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatar: true,
        rating: true,
        reviewsCount: true,
        isActive: true,
      },
      orderBy: [
        { rating: 'desc' },
        { reviewsCount: 'desc' },
      ],
    });

    return masters;
  }
}

