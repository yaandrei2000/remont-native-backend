import { Controller, Get, Post, Body, Param, UseGuards, Patch, Query } from '@nestjs/common';
import { ChatsService } from './chats.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SendMessageDto } from './dto/send-message.dto';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  // Получить или создать чат для пользователя
  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyChat(@CurrentUser() user: any) {
    return this.chatsService.getOrCreateUserChat(user.id);
  }

  // Отправить сообщение от пользователя
  @Post('me/messages')
  @UseGuards(JwtAuthGuard)
  async sendMessage(@CurrentUser() user: any, @Body() dto: SendMessageDto) {
    // Получаем чат пользователя
    const chat = await this.chatsService.getOrCreateUserChat(user.id);
    return this.chatsService.sendUserMessage(user.id, chat.id, dto);
  }

  // Отметить сообщения как прочитанные
  @Post('me/:chatId/read')
  @UseGuards(JwtAuthGuard)
  async markAsRead(@CurrentUser() user: any, @Param('chatId') chatId: string) {
    await this.chatsService.markMessagesAsRead(chatId, user.id);
    return { success: true };
  }

  // ========== ADMIN ENDPOINTS ==========

  // Получить все чаты (для админа)
  @Get('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllChats(@Query('status') status?: 'NEW' | 'ACTIVE' | 'CLOSED') {
    return this.chatsService.getAllChats(status);
  }

  // Получить чат по ID (для админа)
  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getChatById(@Param('id') id: string) {
    return this.chatsService.getChatById(id);
  }

  // Подключиться к чату (для менеджера/админа)
  @Post('admin/:id/assign')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async assignChat(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatsService.assignChatToManager(user.id, id);
  }

  // Отправить сообщение от менеджера
  @Post('admin/:id/messages')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async sendManagerMessage(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatsService.sendManagerMessage(user.id, id, dto);
  }

  // Закрыть чат
  @Patch('admin/:id/close')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async closeChat(@CurrentUser() user: any, @Param('id') id: string) {
    return this.chatsService.closeChat(id, user.id);
  }
}

