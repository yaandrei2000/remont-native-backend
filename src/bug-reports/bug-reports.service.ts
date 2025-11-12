import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../libs/storage/storage.service';
import { ConfigService } from '@nestjs/config';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BugReportsService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) {}

  private getS3BaseUrl(): string {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const bucket = this.configService.get<string>('S3_BUCKET_NAME');
    if (endpoint && bucket) {
      const url = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
      return `https://${url}/${bucket}`;
    }
    return '';
  }

  async createBugReport(
    userId: string | null,
    dto: CreateBugReportDto,
    images: Express.Multer.File[],
    logFile?: Express.Multer.File,
  ) {
    // Проверяем количество изображений (максимум 10)
    if (images && images.length > 10) {
      throw new BadRequestException('Максимум 10 изображений разрешено');
    }

    const baseUrl = this.getS3BaseUrl();
    const uploadedImageUrls: string[] = [];
    let logFileUrl: string | null = null;

    try {
      // Загружаем изображения в S3
      if (images && images.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const image = images[i];
          const fileExtension = image.originalname.split('.').pop() || 'jpg';
          const fileName = `bug-reports/${randomUUID()}.${fileExtension}`;
          const key = `remont/${fileName}`;

          await this.storageService.upload(image.buffer, key, image.mimetype);
          const imageUrl = `${baseUrl}/${key}`;
          uploadedImageUrls.push(imageUrl);
        }
      }

      // Загружаем лог-файл в S3, если он есть
      if (logFile) {
        const fileExtension = logFile.originalname.split('.').pop() || 'txt';
        const fileName = `bug-reports/logs/${randomUUID()}.${fileExtension}`;
        const key = `remont/${fileName}`;

        await this.storageService.upload(logFile.buffer, key, logFile.mimetype);
        logFileUrl = `${baseUrl}/${key}`;
      }

      // Создаем репорт в БД
      const bugReport = await this.prisma.bugReport.create({
        data: {
          userId: userId || null,
          category: dto.category,
          priority: dto.priority || 'MEDIUM',
          description: dto.description,
          steps: dto.steps || null,
          email: dto.email,
          logFileUrl: logFileUrl,
          images: {
            create: uploadedImageUrls.map((url, index) => ({
              imageUrl: url,
              order: index,
            })),
          },
        },
        include: {
          images: {
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      return bugReport;
    } catch (error) {
      // В случае ошибки удаляем загруженные файлы из S3
      if (uploadedImageUrls.length > 0) {
        for (const url of uploadedImageUrls) {
          try {
            const key = this.extractS3Key(url);
            if (key) {
              await this.storageService.remove(key);
            }
          } catch (deleteError) {
            console.error('Failed to delete uploaded image:', deleteError);
          }
        }
      }

      if (logFileUrl) {
        try {
          const key = this.extractS3Key(logFileUrl);
          if (key) {
            await this.storageService.remove(key);
          }
        } catch (deleteError) {
          console.error('Failed to delete uploaded log file:', deleteError);
        }
      }

      throw error;
    }
  }

  private extractS3Key(url: string): string | null {
    if (!url) return null;
    
    try {
      const match = url.match(/remont\/(.+)$/);
      if (match) {
        return `remont/${match[1]}`;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async getBugReports(userId?: string) {
    const where: any = {};
    if (userId) {
      where.userId = userId;
    }

    return this.prisma.bugReport.findMany({
      where,
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async getBugReportById(id: string, userId?: string) {
    const where: any = { id };
    if (userId) {
      where.userId = userId;
    }

    const bugReport = await this.prisma.bugReport.findFirst({
      where,
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });

    return bugReport;
  }

  // ========== ADMIN METHODS ==========

  async getAllBugReports(status?: string) {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.prisma.bugReport.findMany({
      where,
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
          take: 1, // Только первое изображение для превью
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        _count: {
          select: {
            images: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateBugReportStatus(id: string, status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED') {
    const updateData: any = {
      status,
      updatedAt: new Date(),
    };

    if (status === 'RESOLVED' || status === 'CLOSED') {
      updateData.resolvedAt = new Date();
    }

    return this.prisma.bugReport.update({
      where: { id },
      data: updateData,
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
      },
    });
  }
}

