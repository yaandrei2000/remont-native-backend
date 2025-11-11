import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReferralsService {
  constructor(private prisma: PrismaService) {}

  // Генерирует уникальный реферальный код
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Исключаем похожие символы
    let code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  // Получает или создает реферальный код для пользователя
  async getOrCreateReferralCode(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { referralCode: true },
    });

    if (user?.referralCode) {
      return user.referralCode;
    }

    // Генерируем уникальный код
    let code: string = '';
    let exists = true;
    while (exists) {
      code = this.generateReferralCode();
      const existing = await this.prisma.user.findUnique({
        where: { referralCode: code },
      });
      exists = !!existing;
    }

    // Сохраняем код
    await this.prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
    });

    return code;
  }

  // Активирует реферальный код
  async activateReferralCode(userId: string, code: string) {
    // Находим пользователя, который владеет этим кодом
    const referrer = await this.prisma.user.findUnique({
      where: { referralCode: code.toUpperCase() },
    });

    if (!referrer) {
      throw new NotFoundException('Реферальный код не найден');
    }

    if (referrer.id === userId) {
      throw new BadRequestException('Нельзя использовать свой собственный реферальный код');
    }

    // Проверяем, не активировал ли пользователь уже реферальный код
    const existingReferral = await this.prisma.referral.findUnique({
      where: { referredId: userId },
    });

    if (existingReferral) {
      throw new BadRequestException('Вы уже активировали реферальный код');
    }

    // Создаем реферальную связь
    const referral = await this.prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredId: userId,
        status: 'PENDING',
        points: 0, // Баллы будут начислены после первой заявки
      },
      include: {
        referrer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return {
      success: true,
      referral,
    };
  }

  // Получает статистику рефералов для пользователя
  async getReferralStats(userId: string) {
    const referrals = await this.prisma.referral.findMany({
      where: { referrerId: userId },
      include: {
        referred: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const totalReferrals = referrals.length;
    const totalEarned = referrals
      .filter((r) => r.status === 'COMPLETED')
      .reduce((sum, r) => sum + r.points, 0);
    const pendingEarned = referrals
      .filter((r) => r.status === 'PENDING')
      .reduce((sum, r) => sum + 500, 0); // 500 баллов за каждого ожидающего друга

    const referralCode = await this.getOrCreateReferralCode(userId);

    return {
      referralCode,
      totalReferrals,
      totalEarned,
      pendingEarned,
      referrals: referrals.map((r) => ({
        id: r.id,
        name: `${r.referred.firstName || ''} ${r.referred.lastName || ''}`.trim() || 'Пользователь',
        date: r.createdAt.toISOString().split('T')[0],
        status: r.status,
        earned: r.points || (r.status === 'PENDING' ? 0 : 500),
      })),
    };
  }

  // Завершает реферальную программу (вызывается при завершении первой заявки)
  async completeReferral(referredId: string) {
    const referral = await this.prisma.referral.findUnique({
      where: { referredId },
    });

    if (!referral || referral.status === 'COMPLETED') {
      return;
    }

    // Начисляем баллы
    await this.prisma.$transaction(async (tx) => {
      // Обновляем статус реферала
      await tx.referral.update({
        where: { id: referral.id },
        data: {
          status: 'COMPLETED',
          points: 500, // 500 баллов рефереру
          completedAt: new Date(),
        },
      });

      // Начисляем баллы рефереру
      await tx.user.update({
        where: { id: referral.referrerId },
        data: {
          points: {
            increment: 500,
          },
        },
      });

      // Начисляем баллы приглашенному (500 баллов)
      await tx.user.update({
        where: { id: referredId },
        data: {
          points: {
            increment: 500,
          },
        },
      });
    });
  }
}

