import { Injectable } from '@nestjs/common';
import { RedisService } from '../libs/redis/redis.service';
import { ConfigService } from '@nestjs/config';

export interface SessionMetadata {
  userId: string;
  deviceInfo?: string;
  userAgent?: string;
  ipAddress?: string;
  createdAt: number;
  lastActivity: number;
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class SessionsService {
  private readonly SESSION_PREFIX = 'session:';
  private readonly USER_SESSIONS_PREFIX = 'user_sessions:';
  private readonly SESSION_TTL = 7 * 24 * 60 * 60; // 7 дней в секундах

  constructor(
    private readonly redisService: RedisService,
  ) {}

  async createSession(
    userId: string,
    accessToken: string,
    refreshToken: string,
    metadata: {
      deviceInfo?: string;
      userAgent?: string;
      ipAddress?: string;
    },
  ): Promise<string> {
    const createdAt = Date.now();
    const sessionId = `${userId}:${createdAt}`;
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;

    const sessionData: SessionMetadata = {
      userId,
      deviceInfo: metadata.deviceInfo,
      userAgent: metadata.userAgent,
      ipAddress: metadata.ipAddress,
      createdAt,
      lastActivity: Date.now(),
      accessToken,
      refreshToken,
    };

    // Сохраняем сессию
    await this.redisService.setex(
      sessionKey,
      this.SESSION_TTL,
      JSON.stringify(sessionData)
    );

    // Добавляем sessionId в список сессий пользователя
    await this.redisService.sadd(userSessionsKey, sessionId);
    await this.redisService.expire(userSessionsKey, this.SESSION_TTL);

    return sessionId;
  }

  async getSession(sessionId: string): Promise<SessionMetadata | null> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.redisService.get(sessionKey);

    if (!data) {
      return null;
    }

    return JSON.parse(data) as SessionMetadata;
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const data = await this.redisService.get(sessionKey);
    
    if (data) {
      const session = JSON.parse(data) as SessionMetadata;
      session.lastActivity = Date.now();
      await this.redisService.setex(
        sessionKey,
        this.SESSION_TTL,
        JSON.stringify(session)
      );
    }
  }

  async getUserSessions(userId: string): Promise<SessionMetadata[]> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.redisService.smembers(userSessionsKey);

    const sessions: SessionMetadata[] = [];

    for (const sessionId of sessionIds) {
      const session = await this.getSession(sessionId);
      if (session) {
        sessions.push(session);
      } else {
        // Удаляем несуществующие сессии из списка
        await this.redisService.srem(userSessionsKey, sessionId);
      }
    }

    // Сортируем по дате последней активности (новые первыми)
    return sessions.sort((a, b) => b.lastActivity - a.lastActivity);
  }

  async deleteSession(userId: string, sessionId: string): Promise<void> {
    const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;

    await this.redisService.del(sessionKey);
    await this.redisService.srem(userSessionsKey, sessionId);
  }

  async deleteAllUserSessions(userId: string): Promise<void> {
    const userSessionsKey = `${this.USER_SESSIONS_PREFIX}${userId}`;
    const sessionIds = await this.redisService.smembers(userSessionsKey);

    for (const sessionId of sessionIds) {
      const sessionKey = `${this.SESSION_PREFIX}${sessionId}`;
      await this.redisService.del(sessionKey);
    }

    await this.redisService.del(userSessionsKey);
  }

  async findSessionByToken(token: string, tokenType: 'access' | 'refresh' = 'refresh'): Promise<{ session: SessionMetadata; sessionId: string } | null> {
    // Это не самый эффективный способ, но для небольшого количества сессий работает
    // В продакшене можно использовать дополнительный индекс
    const sessions = await this.redisService.keys(`${this.SESSION_PREFIX}*`);
    
    for (const sessionKey of sessions) {
      const data = await this.redisService.get(sessionKey);
      if (data) {
        const session = JSON.parse(data) as SessionMetadata;
        const tokenMatch = tokenType === 'access' 
          ? session.accessToken === token 
          : session.refreshToken === token;
        
        if (tokenMatch) {
          const sessionId = sessionKey.replace(this.SESSION_PREFIX, '');
          return { session, sessionId };
        }
      }
    }

    return null;
  }
}

