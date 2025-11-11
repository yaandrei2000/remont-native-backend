import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PromoCodesService {
  constructor(private prisma: PrismaService) {}

  async getAllPromoCodes() {
    return this.prisma.promoCode.findMany({
      where: {
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async activatePromoCode(userId: string, code: string) {
    // Находим промокод
    const promoCode = await this.prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promoCode) {
      throw new NotFoundException('Промокод не найден');
    }

    if (!promoCode.isActive) {
      throw new BadRequestException('Промокод неактивен');
    }

    // Проверяем срок действия
    if (promoCode.expiresAt && promoCode.expiresAt < new Date()) {
      throw new BadRequestException('Промокод истек');
    }

    // Проверяем лимит использования
    if (promoCode.usageLimit && promoCode.usedCount >= promoCode.usageLimit) {
      throw new BadRequestException('Промокод достиг лимита использований');
    }

    // Проверяем, не использовал ли пользователь уже этот промокод
    const existingUsage = await this.prisma.promoCodeUsage.findUnique({
      where: {
        promoCodeId_userId: {
          promoCodeId: promoCode.id,
          userId: userId,
        },
      },
    });

    if (existingUsage) {
      throw new BadRequestException('Вы уже использовали этот промокод');
    }

    // Активируем промокод
    const result = await this.prisma.$transaction(async (tx) => {
      // Создаем запись об использовании
      const usage = await tx.promoCodeUsage.create({
        data: {
          promoCodeId: promoCode.id,
          userId: userId,
          points: promoCode.points,
        },
      });

      // Увеличиваем счетчик использований
      await tx.promoCode.update({
        where: { id: promoCode.id },
        data: {
          usedCount: {
            increment: 1,
          },
        },
      });

      // Начисляем баллы пользователю
      await tx.user.update({
        where: { id: userId },
        data: {
          points: {
            increment: promoCode.points,
          },
        },
      });

      return usage;
    });

    // Получаем обновленную информацию о промокоде
    const updatedPromoCode = await this.prisma.promoCode.findUnique({
      where: { id: promoCode.id },
      include: {
        usages: {
          where: { userId: userId },
        },
      },
    });

    return {
      success: true,
      points: promoCode.points,
      promoCode: updatedPromoCode,
    };
  }

  async getUserPromoCodes(userId: string) {
    const usages = await this.prisma.promoCodeUsage.findMany({
      where: { userId },
      include: {
        promoCode: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return usages.map((usage) => ({
      id: usage.promoCode.id,
      code: usage.promoCode.code,
      description: usage.promoCode.description,
      points: usage.points,
      isUsed: true,
      usedAt: usage.createdAt,
    }));
  }
}

