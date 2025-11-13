import { Controller, Get, Delete, Param, UseGuards, Req } from '@nestjs/common';
import { Request } from 'express';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('me')
  async getMySessions(@CurrentUser() user: any, @Req() req: any) {
    const sessions = await this.sessionsService.getUserSessions(user.id);
    const currentAccessToken = req.headers.authorization?.replace('Bearer ', '');
    
    // Возвращаем сессии без токенов для безопасности
    return sessions.map((session) => ({
      sessionId: `${session.userId}:${session.createdAt}`,
      deviceInfo: session.deviceInfo,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      lastActivity: session.lastActivity,
      isCurrent: session.accessToken === currentAccessToken,
    }));
  }

  @Delete('me/:sessionId')
  async deleteSession(
    @CurrentUser() user: any,
    @Param('sessionId') sessionId: string,
  ) {
    await this.sessionsService.deleteSession(user.id, sessionId);
    return { message: 'Session deleted successfully' };
  }

  @Delete('me')
  async deleteAllSessions(@CurrentUser() user: any) {
    await this.sessionsService.deleteAllUserSessions(user.id);
    return { message: 'All sessions deleted successfully' };
  }
}

