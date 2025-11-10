import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Injectable()
export class AdminService {
  constructor(private prisma: PrismaService) {}

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

    if (dto.cityId) {
      const city = await this.prisma.city.findUnique({
        where: { id: dto.cityId },
      });
      if (!city) {
        throw new NotFoundException('City not found');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: dto,
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

  async createCategory(dto: CreateCategoryDto) {
    const existing = await this.prisma.serviceCategory.findFirst({
      where: {
        OR: [{ slug: dto.slug }, { name: dto.name }],
      },
    });

    if (existing) {
      throw new BadRequestException('Category with this slug or name already exists');
    }

    return this.prisma.serviceCategory.create({
      data: dto,
    });
  }

  async updateCategory(categoryId: string, dto: UpdateCategoryDto) {
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

    return this.prisma.serviceCategory.update({
      where: { id: categoryId },
      data: dto,
    });
  }

  async deleteCategory(categoryId: string) {
    const category = await this.prisma.serviceCategory.findUnique({
      where: { id: categoryId },
      include: {
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    if (category._count.services > 0) {
      throw new BadRequestException('Cannot delete category with services');
    }

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

  async createService(dto: CreateServiceDto) {
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

    return this.prisma.service.create({
      data: dto,
      include: {
        category: true,
      },
    });
  }

  async updateService(serviceId: string, dto: UpdateServiceDto) {
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

    return this.prisma.service.update({
      where: { id: serviceId },
      data: dto,
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
}

