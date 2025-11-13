import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMasterApplicationDto } from '../admin/dto/create-master-application.dto';
import { StorageService } from '../libs/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) {}

  private getS3BaseUrl(): string {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const bucket = this.configService.get<string>('S3_BUCKET_NAME');
    if (endpoint && bucket) {
      const url = endpoint.replace(/\/$/, '');
      return `https://${url}/${bucket}`;
    }
    return '';
  }

  private extractS3Key(url: string): string | null {
    if (!url) return null;
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/');
      const bucketIndex = pathParts.findIndex(part => part === this.configService.get<string>('S3_BUCKET_NAME'));
      if (bucketIndex !== -1 && bucketIndex < pathParts.length - 1) {
        return pathParts.slice(bucketIndex + 1).join('/');
      }
      // Если URL не содержит bucket в пути, пробуем извлечь из полного пути
      const key = urlObj.pathname.replace(/^\//, '').replace(/^remont\//, 'remont/');
      return key.startsWith('remont/') ? key : `remont/${key}`;
    } catch {
      // Если это не URL, возвращаем как есть (уже ключ)
      return url.startsWith('remont/') ? url : `remont/${url}`;
    }
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
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

  async updateProfile(
    userId: string,
    data: { firstName?: string; lastName?: string; email?: string; avatar?: string },
    avatarFile?: Express.Multer.File,
  ) {
    let avatarUrl = data.avatar;

    // Если передан новый файл, загружаем его в S3
    if (avatarFile) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { avatar: true },
      });

      // Удаляем старое изображение из S3, если оно есть
      if (user?.avatar) {
        try {
          const key = this.extractS3Key(user.avatar);
          if (key) {
            await this.storageService.remove(key);
          }
        } catch (error) {
          console.error(`Failed to delete old avatar:`, error);
        }
      }

      // Загружаем новое изображение
      const fileExtension = avatarFile.originalname.split('.').pop() || 'jpg';
      const fileName = `avatars/${randomUUID()}.${fileExtension}`;
      const key = `remont/${fileName}`;

      await this.storageService.upload(avatarFile.buffer, key, avatarFile.mimetype);

      const baseUrl = this.getS3BaseUrl();
      avatarUrl = baseUrl ? `${baseUrl}/${key}` : key;
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        avatar: avatarUrl,
      },
      select: {
        id: true,
        phone: true,
        firstName: true,
        lastName: true,
        email: true,
        avatar: true,
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



