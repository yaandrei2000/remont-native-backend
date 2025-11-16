import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SessionsService } from '../sessions/sessions.service';
import { SendCodeDto, VerifyCodeDto, RefreshTokenDto } from './dto/auth.dto';
import { RedisService } from 'src/libs/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
    private readonly sessionsService: SessionsService,
  ) {}

  async sendCode(dto: SendCodeDto) {
    const code = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // В продакшене здесь должна быть интеграция с SMS сервисом
    // Для разработки просто сохраняем код в БД
    await this.prisma.authCode.create({
      data: {
        phone: dto.phone,
        code,
        expiresAt,
      },
    });

    // В продакшене отправляем SMS
    console.log(`Code for ${dto.phone}: ${code}`);

    return {
      message: 'Code sent successfully',
      // В разработке возвращаем код для удобства
      ...(this.configService.get('NODE_ENV') === 'development' && { code }),
    };
  }

  async verifyCode(
    dto: VerifyCodeDto,
    metadata?: { 
      deviceInfo?: string; 
      deviceModel?: string;
      deviceName?: string;
      osName?: string;
      osVersion?: string;
      userAgent?: string; 
      ipAddress?: string;
    },
  ) {
    const authCode = await this.prisma.authCode.findFirst({
      where: {
        phone: dto.phone,
        // code: dto.code,
        used: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!authCode) {
      throw new UnauthorizedException('Invalid or expired code');
    }

    // Помечаем код как использованный
    await this.prisma.authCode.update({
      where: { id: authCode.id },
      data: { used: true },
    });

    // Находим или создаем пользователя
    let user = await this.prisma.user.findUnique({
      where: { phone: dto.phone },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          phone: dto.phone,
          points: 0,
        },
      });
    }

    // Генерируем токены
    const tokens = await this.generateTokens(user.id, user.phone);

    // Создаем сессию в Redis
    if (metadata) {
      await this.sessionsService.createSession(
        user.id,
        tokens.accessToken,
        tokens.refreshToken,
        metadata,
      );
    }

    return {
      user: {
        id: user.id,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        points: user.points,
      },
      ...tokens,
    };
  }

  async refreshToken(
    dto: RefreshTokenDto,
    metadata?: { userAgent?: string; ipAddress?: string },
  ) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const tokens = await this.generateTokens(user.id, user.phone);

      // Обновляем сессию или создаем новую при refresh
      if (metadata) {
        // Пытаемся найти существующую сессию по старому refresh токену
        const existingSessionData = await this.sessionsService.findSessionByToken(dto.refreshToken, 'refresh');
        if (existingSessionData) {
          // Обновляем токены и активность существующей сессии
          const session = existingSessionData.session;
          session.accessToken = tokens.accessToken;
          session.refreshToken = tokens.refreshToken;
          session.lastActivity = Date.now();
          
          const sessionKey = `session:${existingSessionData.sessionId}`;
          await this.redisService.set(
            sessionKey,
            JSON.stringify(session),
            'EX',
            7 * 24 * 60 * 60, // 7 дней
          );
        } else {
          // Создаем новую сессию
          await this.sessionsService.createSession(
            user.id,
            tokens.accessToken,
            tokens.refreshToken,
            metadata,
          );
        }
      }

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async generateTokens(userId: string, phone: string) {
    const payload = { sub: userId, phone };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: this.configService.get('JWT_EXPIRES_IN') || '5m',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRES_IN') || '7d',
    });

    return {
      accessToken,
      refreshToken,
      accessTokenExpiration: Date.now() + 60 * 60 * 1000, // 1 hour
    };
  }
}



