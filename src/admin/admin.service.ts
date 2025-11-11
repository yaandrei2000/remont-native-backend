import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../libs/storage/storage.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private storageService: StorageService,
    private configService: ConfigService,
  ) {}

  private getS3BaseUrl(): string {
    const endpoint = this.configService.get<string>('S3_ENDPOINT');
    const bucket = this.configService.get<string>('S3_BUCKET_NAME');
    // Формируем публичный URL для S3
    if (endpoint && bucket) {
      // Если endpoint содержит домен, используем его
      const url = endpoint.replace(/^https?:\/\//, '').replace(/\/$/, '');
      return `https://${url}/${bucket}`;
    }
    return '';
  }

  // ========== USERS ==========
  async getUsers(pagination: PaginationDto, search?: string) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { phone: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          city: {
            select: {
              id: true,
              name: true,
            },
          },
          _count: {
            select: {
              ordersAsClient: true,
              ordersAsMaster: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        city: true,
        ordersAsClient: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        ordersAsMaster: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            ordersAsClient: true,
            ordersAsMaster: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Преобразуем пустую строку в null для cityId
    const updateData: any = {
      ...dto,
      cityId: dto.cityId && typeof dto.cityId === 'string' && dto.cityId.trim() !== '' 
        ? dto.cityId.trim() 
        : null,
    };

    if (updateData.cityId) {
      const city = await this.prisma.city.findUnique({
        where: { id: updateData.cityId },
      });
      if (!city) {
        throw new NotFoundException('City not found');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        city: true,
      },
    });
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === 'ADMIN') {
      throw new BadRequestException('Cannot delete admin user');
    }

    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'User deleted successfully' };
  }

  // ========== ORDERS ==========
  async getOrders(pagination: PaginationDto, filters?: { status?: string; masterId?: string; clientId?: string }) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.masterId) {
      where.masterId = filters.masterId;
    }
    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              service: true,
            },
          },
          client: {
            select: {
              id: true,
              phone: true,
              firstName: true,
              lastName: true,
            },
          },
          master: {
            select: {
              id: true,
              phone: true,
              firstName: true,
              lastName: true,
            },
          },
          steps: {
            orderBy: { createdAt: 'asc' },
          },
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getOrderById(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        client: true,
        master: true,
        steps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateOrder(orderId: string, dto: UpdateOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (dto.masterId) {
      const master = await this.prisma.user.findUnique({
        where: { id: dto.masterId },
      });
      if (!master || master.role !== 'MASTER') {
        throw new BadRequestException('Invalid master ID');
      }
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: dto,
      include: {
        items: {
          include: {
            service: true,
          },
        },
        client: true,
        master: true,
        steps: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });
  }

  // ========== MASTERS ==========
  async getMasters(pagination: PaginationDto, filters?: { isActive?: boolean; cityId?: string }) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {
      role: 'MASTER',
    };

    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters?.cityId) {
      where.cityId = filters.cityId;
    }

    const [masters, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          city: true,
          _count: {
            select: {
              ordersAsMaster: true,
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      masters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async approveMaster(masterId: string) {
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
    });

    if (!master || master.role !== 'MASTER') {
      throw new NotFoundException('Master not found');
    }

    return this.prisma.user.update({
      where: { id: masterId },
      data: { isActive: true },
    });
  }

  async blockMaster(masterId: string) {
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
    });

    if (!master || master.role !== 'MASTER') {
      throw new NotFoundException('Master not found');
    }

    return this.prisma.user.update({
      where: { id: masterId },
      data: { isActive: false },
    });
  }

  // ========== CATEGORIES ==========
  async getCategories() {
    return this.prisma.serviceCategory.findMany({
      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryById(categoryId: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include: {
        services: true,
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  async createCategory(dto: CreateCategoryDto, imageFile?: any) {
    const existing = await this.prisma.serviceCategory.findFirst({
      where: {
        OR: [{ slug: dto.slug }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new BadRequestException('Category with this slug or name already exists');
    }

    let imageUrl = dto.image;

    // Если передан файл, загружаем его в S3
    if (imageFile) {
      const fileExtension = imageFile.originalname.split('.').pop() || 'jpg';
      const fileName = `categories/${uuidv4()}.${fileExtension}`;
      
      await this.storageService.upload(
        imageFile.buffer,
        fileName,
        imageFile.mimetype
      );

      const baseUrl = this.getS3BaseUrl();
      imageUrl = baseUrl ? `${baseUrl}/${fileName}` : fileName;
    }

    return this.prisma.serviceCategory.create({
      data: {
        ...dto,
        image: imageUrl,
      },
    });
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto, imageFile?: any) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (dto.slug || dto.name) {
      const existing = await this.prisma.serviceCategory.findFirst({
        where: {
          AND: [
            { id: { not: categoryId } },
            {
              OR: [
                ...(dto.slug ? [{ slug: dto.slug }] : []),
                ...(dto.name ? [{ name: dto.name }] : []),
              ],
            },
          ],
        },
      });

      if (existing) {
        throw new BadRequestException('Category with this slug or name already exists');
      }
    }

    let imageUrl = dto.image;

    // Если передан новый файл, загружаем его в S3
    if (imageFile) {
      // Удаляем старое изображение из S3, если оно есть
      if (category.image) {
        try {
          const key = this.extractS3Key(category.image);
          if (key) {
            await this.storageService.remove(key);
          }
        } catch (error) {
          console.error(`Failed to delete old category image:`, error);
        }
      }

      // Загружаем новое изображение
      const fileExtension = imageFile.originalname.split('.').pop() || 'jpg';
      const fileName = `categories/${uuidv4()}.${fileExtension}`;
      
      await this.storageService.upload(
        imageFile.buffer,
        fileName,
        imageFile.mimetype
      );

      const baseUrl = this.getS3BaseUrl();
      imageUrl = baseUrl ? `${baseUrl}/${fileName}` : fileName;
    }

    return this.prisma.serviceCategory.update({
      where: { id: categoryId },
      data: {
        ...dto,
        image: imageUrl,
      },
    });
  }

  private extractS3Key(url: string): string | null {
    if (!url) return null;
    
    try {
      const servicesMatch = url.match(/services\/([^\/]+\.\w+)/);
      const categoriesMatch = url.match(/categories\/([^\/]+\.\w+)/);
      
      if (servicesMatch) {
        return `services/${servicesMatch[1]}`;
      }
      if (categoriesMatch) {
        return `categories/${categoriesMatch[1]}`;
      }
      
      const urlParts = url.split('/');
      const key = urlParts.slice(-2).join('/');
      if (key.startsWith('services/') || key.startsWith('categories/')) {
        return key;
      }
      
      return null;
    } catch (error) {
      return null;
    }
  }

  async deleteCategory(categoryId: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include: {
        services: {
          select: {
            id: true,
            image: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    // Вспомогательная функция для извлечения ключа из URL
    const extractS3Key = (url: string): string | null => {
      if (!url) return null;
      
      try {
        // Если URL содержит "services/" или "categories/", извлекаем ключ
        const servicesMatch = url.match(/services\/([^\/]+\.\w+)/);
        const categoriesMatch = url.match(/categories\/([^\/]+\.\w+)/);
        
        if (servicesMatch) {
          return `services/${servicesMatch[1]}`;
        }
        if (categoriesMatch) {
          return `categories/${categoriesMatch[1]}`;
        }
        
        // Если не нашли паттерн, пробуем извлечь последние 2 части пути
        const urlParts = url.split('/');
        const key = urlParts.slice(-2).join('/');
        if (key.startsWith('services/') || key.startsWith('categories/')) {
          return key;
        }
        
        return null;
      } catch (error) {
        return null;
      }
    };

    // Удаляем изображения услуг из S3 перед удалением категории
    // (каскадное удаление услуг произойдет автоматически благодаря onDelete: Cascade)
    for (const service of category.services) {
      if (service.image) {
        try {
          const key = extractS3Key(service.image);
          if (key) {
            await this.storageService.remove(key);
          }
        } catch (error) {
          // Логируем ошибку, но не прерываем удаление категории
          console.error(`Failed to delete image for service ${service.id}:`, error);
        }
      }
    }

    // Удаляем изображение категории из S3, если оно есть
    if (category.image) {
      try {
        const key = extractS3Key(category.image);
        if (key) {
          await this.storageService.remove(key);
        }
      } catch (error) {
        console.error(`Failed to delete category image:`, error);
      }
    }

    // Удаляем категорию (услуги удалятся автоматически благодаря onDelete: Cascade)
    await this.prisma.serviceCategory.delete({
      where: { id: categoryId },
    });

    return { message: 'Category deleted successfully' };
  }

  // ========== SERVICES ==========
  async getServices(pagination: PaginationDto, categoryId?: string) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (categoryId) {
      where.categoryId = categoryId;
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          category: true,
        },
      }),
      this.prisma.service.count({ where }),
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

  async getServiceById(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
      include: {
        category: true,
      },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    return service;
  }

  async createService(dto: CreateServiceDto, imageFile?: any) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: dto.categoryId },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    const existing = await this.prisma.service.findUnique({
      where: {
        categoryId_slug: {
          categoryId: dto.categoryId,
          slug: dto.slug,
        },
      },
    });

    if (existing) {
      throw new BadRequestException('Service with this slug already exists in this category');
    }

    let imageUrl = dto.image;

    // Если передан файл, загружаем его в S3
    if (imageFile) {
      const fileExtension = imageFile.originalname.split('.').pop() || 'jpg';
      const fileName = `services/${uuidv4()}.${fileExtension}`;
      
      await this.storageService.upload(
        imageFile.buffer,
        fileName,
        imageFile.mimetype
      );

      const baseUrl = this.getS3BaseUrl();
      imageUrl = baseUrl ? `${baseUrl}/${fileName}` : fileName;
    }

    return this.prisma.service.create({
      data: {
        ...dto,
        image: imageUrl,
      },
      include: {
        category: true,
      },
    });
  }

  async updateService(serviceId: string, dto: UpdateServiceDto, imageFile?: any) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    if (dto.categoryId) {
      const category = await this.prisma.serviceCategory.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException('Category not found');
      }
    }

    if (dto.slug) {
      const existing = await this.prisma.service.findUnique({
        where: {
          categoryId_slug: {
            categoryId: dto.categoryId || service.categoryId,
            slug: dto.slug,
          },
        },
      });

      if (existing && existing.id !== serviceId) {
        throw new BadRequestException('Service with this slug already exists in this category');
      }
    }

    let imageUrl = dto.image;

    // Если передан новый файл, загружаем его в S3
    if (imageFile) {
      // Удаляем старое изображение из S3, если оно есть
      if (service.image) {
        try {
          const key = this.extractS3Key(service.image);
          if (key) {
            await this.storageService.remove(key);
          }
        } catch (error) {
          console.error(`Failed to delete old service image:`, error);
        }
      }

      // Загружаем новое изображение
      const fileExtension = imageFile.originalname.split('.').pop() || 'jpg';
      const fileName = `services/${uuidv4()}.${fileExtension}`;
      
      await this.storageService.upload(
        imageFile.buffer,
        fileName,
        imageFile.mimetype
      );

      const baseUrl = this.getS3BaseUrl();
      imageUrl = baseUrl ? `${baseUrl}/${fileName}` : fileName;
    }

    return this.prisma.service.update({
      where: { id: serviceId },
      data: {
        ...dto,
        image: imageUrl,
      },
      include: {
        category: true,
      },
    });
  }

  async deleteService(serviceId: string) {
    const service = await this.prisma.service.findUnique({
      where: { id: serviceId },
    });

    if (!service) {
      throw new NotFoundException('Service not found');
    }

    await this.prisma.service.delete({
      where: { id: serviceId },
    });

    return { message: 'Service deleted successfully' };
  }

  // ========== STATISTICS ==========
  async getStatistics() {
    const [
      totalUsers,
      totalClients,
      totalMasters,
      activeMasters,
      totalOrders,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      totalCategories,
      totalServices,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'CLIENT' } }),
      this.prisma.user.count({ where: { role: 'MASTER' } }),
      this.prisma.user.count({ where: { role: 'MASTER', isActive: true } }),
      this.prisma.order.count(),
      this.prisma.order.count({ where: { status: 'PENDING' } }),
      this.prisma.order.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.order.count({ where: { status: 'COMPLETED' } }),
      this.prisma.serviceCategory.count(),
      this.prisma.service.count(),
    ]);

    const recentOrders = await this.prisma.order.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
        master: {
          select: {
            phone: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const revenue = await this.prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
      },
      _sum: {
        totalPrice: true,
      },
    });

    return {
      users: {
        total: totalUsers,
        clients: totalClients,
        masters: totalMasters,
        activeMasters,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        inProgress: inProgressOrders,
        completed: completedOrders,
      },
      services: {
        categories: totalCategories,
        services: totalServices,
      },
      revenue: revenue._sum.totalPrice || 0,
      recentOrders,
    };
  }

  // ========== SERVICE CITIES MANAGEMENT ==========
  async getCities() {
    return this.prisma.city.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
  }

  async getCityServices(cityId: string) {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Получаем все услуги с информацией о том, привязаны ли они к городу
    const allServices = await this.prisma.service.findMany({
      include: {
        category: true,
        cities: {
          where: {
            cityId: cityId,
          },
        },
      },
      orderBy: {
        category: {
          name: 'asc',
        },
      },
    });

    return {
      city,
      services: allServices.map((service) => ({
        ...service,
        isAttached: service.cities.length > 0,
      })),
    };
  }

  async manageCityServices(cityId: string, serviceIds: string[]) {
    const city = await this.prisma.city.findUnique({
      where: { id: cityId },
    });

    if (!city) {
      throw new NotFoundException('City not found');
    }

    // Проверяем существование всех услуг
    const services = await this.prisma.service.findMany({
      where: {
        id: {
          in: serviceIds,
        },
      },
    });

    if (services.length !== serviceIds.length) {
      throw new BadRequestException('Some services not found');
    }

    // Удаляем все существующие связи для этого города
    await this.prisma.serviceCity.deleteMany({
      where: {
        cityId: cityId,
      },
    });

    // Создаем новые связи
    if (serviceIds.length > 0) {
      await this.prisma.serviceCity.createMany({
        data: serviceIds.map((serviceId) => ({
          serviceId,
          cityId,
        })),
      });
    }

    return {
      message: 'Services updated for city',
      cityId,
      serviceIds,
    };
  }

  // ========== MASTER APPLICATIONS ==========
  async getMasterApplications(pagination: PaginationDto, status?: string) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) {
      where.status = status;
    }

    const [applications, total] = await Promise.all([
      this.prisma.masterApplication.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              phone: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          processedBy: {
            select: {
              id: true,
              phone: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      }),
      this.prisma.masterApplication.count({ where }),
    ]);

    return {
      applications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getMasterApplicationById(applicationId: string) {
    const application = await this.prisma.masterApplication.findUnique({
      where: { id: applicationId },
      include: {
        user: {
          include: {
            city: true,
            _count: {
              select: {
                ordersAsClient: true,
                ordersAsMaster: true,
              },
            },
          },
        },
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

    if (!application) {
      throw new NotFoundException('Master application not found');
    }

    return application;
  }

  async approveMasterApplication(applicationId: string, adminId: string) {
    const application = await this.prisma.masterApplication.findUnique({
      where: { id: applicationId },
      include: { user: true },
    });

    if (!application) {
      throw new NotFoundException('Master application not found');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException('Application already processed');
    }

    // Обновляем заявку
    await this.prisma.masterApplication.update({
      where: { id: applicationId },
      data: {
        status: 'APPROVED',
        processedAt: new Date(),
        processedById: adminId,
      },
    });

    // Переводим пользователя в мастера
    await this.prisma.user.update({
      where: { id: application.userId },
      data: {
        role: 'MASTER',
        firstName: application.name.split(' ')[0] || application.name,
        lastName: application.name.split(' ').slice(1).join(' ') || null,
        email: application.email || application.user.email,
        isActive: true,
      },
    });

    return {
      message: 'Master application approved',
      applicationId,
    };
  }

  async rejectMasterApplication(
    applicationId: string,
    adminId: string,
    rejectionReason?: string,
  ) {
    const application = await this.prisma.masterApplication.findUnique({
      where: { id: applicationId },
    });

    if (!application) {
      throw new NotFoundException('Master application not found');
    }

    if (application.status !== 'PENDING') {
      throw new BadRequestException('Application already processed');
    }

    await this.prisma.masterApplication.update({
      where: { id: applicationId },
      data: {
        status: 'REJECTED',
        processedAt: new Date(),
        processedById: adminId,
        rejectionReason: rejectionReason || null,
      },
    });

    return {
      message: 'Master application rejected',
      applicationId,
    };
  }

  async demoteMaster(userId: string, adminId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { masterApplication: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role !== 'MASTER') {
      throw new BadRequestException('User is not a master');
    }

    // Переводим пользователя обратно в клиента
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        role: 'CLIENT',
        isActive: false,
      },
    });

    // Если есть заявка, помечаем её как отклоненную
    if (user.masterApplication) {
      await this.prisma.masterApplication.update({
        where: { id: user.masterApplication.id },
        data: {
          status: 'REJECTED',
          processedAt: new Date(),
          processedById: adminId,
          rejectionReason: 'Разжалован администратором',
        },
      });
    }

    return {
      message: 'Master demoted to client',
      userId,
    };
  }
}

