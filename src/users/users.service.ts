import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterApplicationDto } from '../admin/dto/create-master-application.dto';

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

  async createMasterApplication(userId: string, dto: CreateMasterApplicationDto) {
    // Проверяем, есть ли уже заявка у пользователя
    const existingApplication = await this.prisma.masterApplication.findUnique({
      where: { userId },
    });

    if (existingApplication) {
      if (existingApplication.status === 'PENDING') {
        throw new BadRequestException('You already have a pending application');
      }
      if (existingApplication.status === 'APPROVED') {
        throw new BadRequestException('You are already a master');
      }
    }

    // Проверяем, не является ли пользователь уже мастером
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.role === 'MASTER') {
      throw new BadRequestException('You are already a master');
    }

    // Создаем или обновляем заявку
    const application = await this.prisma.masterApplication.upsert({
      where: { userId },
      create: {
        userId,
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        experience: dto.experience,
        specialties: dto.specialties,
        description: dto.description,
        status: 'PENDING',
      },
      update: {
        name: dto.name,
        phone: dto.phone,
        email: dto.email,
        experience: dto.experience,
        specialties: dto.specialties,
        description: dto.description,
        status: 'PENDING',
        processedAt: null,
        processedById: null,
        rejectionReason: null,
      },
    });

    return application;
  }

  async getMasterApplication(userId: string) {
    const application = await this.prisma.masterApplication.findUnique({
      where: { userId },
      include: {
        processedBy: {
          select: {
            id: true,
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return application;
  }
}



