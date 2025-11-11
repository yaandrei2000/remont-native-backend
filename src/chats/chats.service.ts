import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatsService {
  constructor(private prisma: PrismaService) {}

  // Получить или создать чат для пользователя
  async getOrCreateUserChat(userId: string) {
    // Ищем активный чат пользователя
    let chat = await this.prisma.chat.findFirst({
      where: {
        userId,
        status: {
          in: ['NEW', 'ACTIVE'],
        },
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Если чата нет, создаем новый
    if (!chat) {
      chat = await this.prisma.chat.create({
        data: {
          userId,
          status: 'NEW',
        },
        include: {
          messages: {
            orderBy: {
              createdAt: 'asc',
            },
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          manager: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });
    }

    return chat;
  }

  // Отправить сообщение от пользователя
  async sendUserMessage(userId: string, chatId: string, dto: SendMessageDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    if (chat.userId !== userId) {
      throw new BadRequestException('Нет доступа к этому чату');
    }

    // Если чат был закрыт, открываем его
    if (chat.status === 'CLOSED') {
      await this.prisma.chat.update({
        where: { id: chatId },
        data: { status: 'ACTIVE', closedAt: null },
      });
    }

    // Создаем сообщение
    const message = await this.prisma.chatMessage.create({
      data: {
        chatId,
        text: dto.text,
        isFromUser: true,
      },
    });

    // Обновляем updatedAt чата
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  // Отправить сообщение от менеджера
  async sendManagerMessage(managerId: string, chatId: string, dto: SendMessageDto) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    // Если менеджер еще не подключен к чату, подключаем его
    if (!chat.managerId) {
      await this.prisma.chat.update({
        where: { id: chatId },
        data: {
          managerId,
          status: 'ACTIVE',
        },
      });
    } else if (chat.managerId !== managerId) {
      throw new BadRequestException('Этот чат уже обрабатывается другим менеджером');
    }

    // Создаем сообщение
    const message = await this.prisma.chatMessage.create({
      data: {
        chatId,
        text: dto.text,
        isFromUser: false,
      },
    });

    // Обновляем updatedAt чата
    await this.prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  // Получить все чаты (для админа)
  async getAllChats(status?: 'NEW' | 'ACTIVE' | 'CLOSED') {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    const chats = await this.prisma.chat.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1, // Последнее сообщение
        },
        _count: {
          select: {
            messages: true,
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return chats;
  }

  // Получить чат по ID (для админа)
  async getChatById(chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
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
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    return chat;
  }

  // Подключиться к чату (для менеджера)
  async assignChatToManager(managerId: string, chatId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    if (chat.managerId && chat.managerId !== managerId) {
      throw new BadRequestException('Этот чат уже обрабатывается другим менеджером');
    }

    if (chat.status === 'CLOSED') {
      throw new BadRequestException('Нельзя подключиться к закрытому чату');
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: {
        managerId,
        status: 'ACTIVE',
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        manager: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return updatedChat;
  }

  // Закрыть чат
  async closeChat(chatId: string, managerId?: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    // Если указан managerId, проверяем права
    if (managerId && chat.managerId !== managerId) {
      throw new BadRequestException('Нет прав для закрытия этого чата');
    }

    const updatedChat = await this.prisma.chat.update({
      where: { id: chatId },
      data: {
        status: 'CLOSED',
        closedAt: new Date(),
      },
    });

    return updatedChat;
  }

  // Отметить сообщения как прочитанные
  async markMessagesAsRead(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findUnique({
      where: { id: chatId },
    });

    if (!chat) {
      throw new NotFoundException('Чат не найден');
    }

    // Пользователь может читать только сообщения от менеджера
    // Менеджер может читать только сообщения от пользователя
    const isFromUser = chat.userId === userId;

    await this.prisma.chatMessage.updateMany({
      where: {
        chatId,
        isFromUser: !isFromUser, // Противоположное значение
        readAt: null,
      },
      data: {
        readAt: new Date(),
      },
    });
  }
}

