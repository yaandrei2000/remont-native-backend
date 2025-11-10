import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        email: true,
        points: true,
        role: true,
        cityId: true,
        city: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateCity(userId: string, cityId: string) {
    // Проверяем, существует ли город
    if (cityId) {
      const city = await this.prisma.city.findUnique({
        where: { id: cityId },
      });
      if (!city) {
        throw new NotFoundException('City not found');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { cityId: cityId || null },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        email: true,
        points: true,
        cityId: true,
        city: {
          select: {
            id: true,
            name: true,
            region: true,
          },
        },
      },
    });
  }

  async updateProfile(userId: string, data: { firstName?: string; lastName?: string; email?: string }) {
    return this.prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        email: true,
        points: true,
      },
    });
  }

  async updatePushToken(userId: string, pushToken: string | null) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { pushToken },
      select: {
        id: true,
        pushToken: true,
      },
    });
  }
}



