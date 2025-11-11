import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ReferralsService } from '../referrals/referrals.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private referralsService: ReferralsService,
  ) {}

  async createOrder(dto: CreateOrderDto, clientId?: string) {
    // Генерируем номер заказа
    const orderNumber = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Получаем услуги для расчета цены
    const services = await this.prisma.service.findMany({
      where: {
        id: {
          in: dto.items.map(item => item.serviceId),
        },
      },
    });

    // Рассчитываем общую цену
    let totalPrice = 0;
    for (const item of dto.items) {
      const service = services.find(s => s.id === item.serviceId);
      if (service && service.price) {
        totalPrice += service.price * (item.quantity || 1);
      }
    }

    // Создаем заказ
    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        clientId: clientId || null,
        recipient: dto.recipient,
        clientName: dto.clientName,
        clientPhone: dto.clientPhone,
        city: dto.city,
        address: dto.address,
        apartment: dto.apartment,
        isPrivateHouse: dto.isPrivateHouse || false,
        urgency: dto.urgency || 'URGENT',
        scheduledDate: dto.scheduledDate ? new Date(dto.scheduledDate) : null,
        scheduledTime: dto.scheduledTime,
        totalPrice,
        status: 'PENDING',
        items: {
          create: dto.items.map(item => ({
            serviceId: item.serviceId,
            quantity: item.quantity || 1,
            price: services.find(s => s.id === item.serviceId)?.price || 0,
          })),
        },
        steps: {
          create: [
            {
              title: 'Заявка принята',
              description: 'Ваша заявка принята в обработку',
              status: 'COMPLETED',
              completedAt: new Date(),
            },
            {
              title: 'Мастер назначен',
              description: 'Ожидайте назначения мастера',
              status: 'PENDING',
            },
            {
              title: 'Мастер в пути',
              description: 'Мастер выехал к вам',
              status: 'PENDING',
            },
            {
              title: 'Диагностика',
              description: 'Проводится диагностика',
              status: 'PENDING',
            },
            {
              title: 'Выполнение работ',
              description: 'Мастер выполняет работы',
              status: 'PENDING',
            },
            {
              title: 'Заказ завершен',
              description: 'Все работы выполнены, заказ закрыт',
              status: 'PENDING',
            },
          ],
        },
      },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        steps: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        master: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            rating: true,
            reviewsCount: true,
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
      },
    });

    // Отправляем уведомления всем активным мастерам в городе заказа
    this.notifyMastersAboutNewOrder(order.id, dto.city).catch((error) => {
      console.error('Failed to notify masters about new order:', error);
    });

    return order;
  }

  private async notifyMastersAboutNewOrder(orderId: string, city: string) {
    try {
      // Находим город по названию
      const cityRecord = await this.prisma.city.findFirst({
        where: { name: city },
      });

      if (!cityRecord) {
        return;
      }

      // Получаем всех активных мастеров в этом городе с push токенами
      const masters = await this.prisma.user.findMany({
        where: {
          role: UserRole.MASTER,
          isActive: true,
          cityId: cityRecord.id,
          pushToken: { not: null },
        },
        select: {
          pushToken: true,
        },
      });

      if (masters.length === 0) {
        return;
      }

      // Фильтруем только валидные токены
      const pushTokens = masters
        .map((master) => master.pushToken)
        .filter((token): token is string => token !== null);

      if (pushTokens.length === 0) {
        return;
      }

      // Отправляем уведомления
      await this.notificationsService.sendPushNotificationsToMasters(
        pushTokens,
        'Новый заказ в вашем городе!',
        `Появился новый заказ в городе ${city}. Посмотрите доступные заказы.`,
        {
          route: '/master/available-orders',
          orderId,
          type: 'new_order',
        },
      );
    } catch (error) {
      console.error('Error notifying masters:', error);
    }
  }

  async getUserOrders(clientId: string, pagination: PaginationDto) {
    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { clientId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              service: true,
            },
          },
          master: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
              rating: true,
              reviewsCount: true,
            },
          },
        },
      }),
      this.prisma.order.count({
        where: { clientId },
      }),
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

  async getOrder(orderId: string, clientId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        steps: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        master: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            rating: true,
            reviewsCount: true,
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
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Проверяем, что заказ принадлежит пользователю (если заказ привязан к пользователю)
    if (order.clientId && order.clientId !== clientId) {
      throw new ForbiddenException('Access denied');
    }

    return order;
  }

  // Получить доступные заказы для мастера (по его городу)
  async getAvailableOrders(masterId: string, pagination: PaginationDto) {
    // Получаем город мастера
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
      select: { cityId: true, role: true },
    });

    if (!master || master.role !== 'MASTER') {
      throw new ForbiddenException('Only masters can access available orders');
    }

    if (!master.cityId) {
      // Если у мастера не указан город, возвращаем пустой список
      return {
        orders: [],
        pagination: {
          page: pagination.page || 1,
          limit: pagination.limit || 10,
          total: 0,
          totalPages: 0,
        },
      };
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    // Получаем город мастера для фильтрации
    const masterCity = await this.prisma.city.findUnique({
      where: { id: master.cityId },
      select: { name: true },
    });

    if (!masterCity) {
      throw new NotFoundException('Master city not found');
    }

    // Получаем заказы, которые:
    // 1. В городе мастера
    // 2. Статус PENDING или CONFIRMED (еще не взяты)
    // 3. Не назначены другому мастеру
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          city: masterCity.name,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          masterId: null, // Заказ еще не назначен мастеру
        },
        skip,
        take: limit,
        orderBy: [
          { urgency: 'desc' }, // Сначала срочные
          { createdAt: 'asc' }, // Потом по дате создания
        ],
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
        },
      }),
      this.prisma.order.count({
        where: {
          city: masterCity.name,
          status: {
            in: ['PENDING', 'CONFIRMED'],
          },
          masterId: null,
        },
      }),
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

  // Получить заказы мастера
  async getMasterOrders(masterId: string, pagination: PaginationDto) {
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
      select: { role: true },
    });

    if (!master || master.role !== 'MASTER') {
      throw new ForbiddenException('Only masters can access their orders');
    }

    const page = pagination.page || 1;
    const limit = pagination.limit || 10;
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { masterId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: {
            include: {
              service: true,
            },
          },
          steps: {
            orderBy: {
              createdAt: 'asc',
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
        },
      }),
      this.prisma.order.count({
        where: { masterId },
      }),
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

  // Взять заказ мастером
  async assignOrder(orderId: string, masterId: string) {
    // Проверяем, что пользователь - мастер
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
      select: { role: true, cityId: true, isActive: true },
    });

    if (!master || master.role !== 'MASTER') {
      throw new ForbiddenException('Only masters can assign orders');
    }

    if (!master.isActive) {
      throw new BadRequestException('Master account is not active');
    }

    // Получаем заказ
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: {
          select: {
            cityId: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Проверяем, что заказ еще не назначен
    if (order.masterId) {
      throw new BadRequestException('Order is already assigned to another master');
    }

    // Проверяем статус заказа
    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestException(`Cannot assign order with status ${order.status}`);
    }

    // Проверяем, что город заказа совпадает с городом мастера
    if (master.cityId) {
      const masterCity = await this.prisma.city.findUnique({
        where: { id: master.cityId },
        select: { name: true },
      });

      if (masterCity && order.city !== masterCity.name) {
        throw new BadRequestException('Order city does not match master city');
      }
    }

    // Назначаем заказ мастеру и сразу переводим в работу (IN_PROGRESS)
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        masterId,
        status: 'IN_PROGRESS', // Сразу переводим в работу
      },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        steps: {
          orderBy: {
            createdAt: 'asc',
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
            firstName: true,
            lastName: true,
            phone: true,
            rating: true,
            reviewsCount: true,
          },
        },
      },
    });

    // Обновляем этап "Мастер назначен"
    await this.prisma.orderStep.updateMany({
      where: {
        orderId,
        title: 'Мастер назначен',
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    // Автоматически обновляем этап "Мастер в пути" при взятии заказа
    await this.prisma.orderStep.updateMany({
      where: {
        orderId,
        title: 'Мастер в пути',
      },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return updatedOrder;
  }

  // Обновить статус заказа
  async updateOrderStatus(orderId: string, masterId: string, dto: UpdateOrderStatusDto) {
    // Проверяем, что пользователь - мастер
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
      select: { role: true },
    });

    if (!master || master.role !== 'MASTER') {
      throw new ForbiddenException('Only masters can update order status');
    }

    // Получаем заказ
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Проверяем, что заказ назначен этому мастеру
    if (order.masterId !== masterId) {
      throw new ForbiddenException('Order is not assigned to you');
    }

    // Валидация переходов статусов
    const validTransitions: Record<string, string[]> = {
      ASSIGNED: ['IN_PROGRESS', 'CANCELLED'],
      IN_PROGRESS: ['COMPLETED', 'CANCELLED'],
      CONFIRMED: ['ASSIGNED', 'CANCELLED'],
    };

    const allowedStatuses = validTransitions[order.status] || [];
    if (!allowedStatuses.includes(dto.status)) {
      throw new BadRequestException(
        `Cannot change status from ${order.status} to ${dto.status}`,
      );
    }

    // Обновляем статус заказа
    const updateData: any = {
      status: dto.status,
    };

    if (dto.status === 'COMPLETED') {
      updateData.completedAt = new Date();
      // Завершаем все этапы
      await this.prisma.orderStep.updateMany({
        where: {
          orderId,
          status: { not: 'COMPLETED' },
        },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Проверяем, является ли это первой завершенной заявкой клиента
      if (order.clientId) {
        const completedOrdersCount = await this.prisma.order.count({
          where: {
            clientId: order.clientId,
            status: 'COMPLETED',
            id: { not: orderId }, // Исключаем текущий заказ
          },
        });

        // Если это первая завершенная заявка, завершаем реферальную программу
        if (completedOrdersCount === 0) {
          await this.referralsService.completeReferral(order.clientId);
        }
      }
    }

    if (dto.status === 'CANCELLED' && dto.reason) {
      // Можно добавить поле reason в модель Order, если нужно
      // Пока просто обновляем статус
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: updateData,
      include: {
        items: {
          include: {
            service: true,
          },
        },
        steps: {
          orderBy: {
            createdAt: 'asc',
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
            firstName: true,
            lastName: true,
            phone: true,
            rating: true,
            reviewsCount: true,
          },
        },
      },
    });

    return updatedOrder;
  }

  // Обновить этап заказа
  async updateOrderStep(orderId: string, stepId: string, masterId: string, status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED') {
    // Проверяем, что пользователь - мастер
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
      select: { role: true },
    });

    if (!master || master.role !== 'MASTER') {
      throw new ForbiddenException('Only masters can update order steps');
    }

    // Получаем заказ
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Проверяем, что заказ назначен этому мастеру
    if (order.masterId !== masterId) {
      throw new ForbiddenException('Order is not assigned to you');
    }

    // Обновляем этап
    const step = await this.prisma.orderStep.update({
      where: { id: stepId },
      data: {
        status,
        completedAt: status === 'COMPLETED' ? new Date() : null,
      },
    });

    return step;
  }

  // Получить заказ для мастера (с проверкой прав)
  async getOrderForMaster(orderId: string, masterId: string) {
    const master = await this.prisma.user.findUnique({
      where: { id: masterId },
      select: { role: true },
    });

    if (!master || master.role !== 'MASTER') {
      throw new ForbiddenException('Only masters can access this endpoint');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        steps: {
          orderBy: {
            createdAt: 'asc',
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
            firstName: true,
            lastName: true,
            phone: true,
            rating: true,
            reviewsCount: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Мастер может видеть заказ, если:
    // 1. Заказ назначен ему
    // 2. Заказ доступен для взятия (PENDING/CONFIRMED и не назначен)
    if (order.masterId && order.masterId !== masterId) {
      throw new ForbiddenException('Order is assigned to another master');
    }

    return order;
  }

  // Отменить заказ клиентом
  async cancelOrderByClient(orderId: string, clientId: string, dto: CancelOrderDto) {
    // Получаем заказ
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        client: {
          select: { id: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Проверяем, что заказ принадлежит клиенту
    if (order.clientId && order.clientId !== clientId) {
      throw new ForbiddenException('You can only cancel your own orders');
    }

    // Проверяем, что заказ можно отменить (только PENDING или CONFIRMED, и мастер не назначен)
    if (order.status !== 'PENDING' && order.status !== 'CONFIRMED') {
      throw new BadRequestException(
        `Cannot cancel order with status ${order.status}. Only PENDING or CONFIRMED orders can be cancelled.`,
      );
    }

    if (order.masterId) {
      throw new BadRequestException('Cannot cancel order: master is already assigned');
    }

    // Обновляем статус заказа
    const updatedOrder = await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status: 'CANCELLED',
      },
      include: {
        items: {
          include: {
            service: true,
          },
        },
        steps: {
          orderBy: {
            createdAt: 'asc',
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
            firstName: true,
            lastName: true,
            phone: true,
            rating: true,
            reviewsCount: true,
          },
        },
      },
    });

    return updatedOrder;
  }
}



