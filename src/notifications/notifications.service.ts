import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private readonly expoPushApiUrl = 'https://exp.host/--/api/v2/push/send';

  async sendPushNotification(
    pushToken: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<boolean> {
    try {
      const message = {
        to: pushToken,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
        channelId: 'default',
      };

      const response = await fetch(this.expoPushApiUrl, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (!response.ok) {
        const error = await response.text();
        this.logger.error(`Failed to send push notification: ${error}`);
        return false;
      }

      const result = await response.json();
      
      // Проверяем статус доставки
      if (result.data?.status === 'error') {
        this.logger.error(`Push notification error: ${result.data.message}`);
        return false;
      }

      this.logger.log(`Push notification sent successfully to ${pushToken}`);
      return true;
    } catch (error) {
      this.logger.error(`Error sending push notification: ${error.message}`);
      return false;
    }
  }

  async sendPushNotificationsToMasters(
    pushTokens: string[],
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<number> {
    if (pushTokens.length === 0) {
      return 0;
    }

    // Expo Push API поддерживает отправку до 100 уведомлений за раз
    const batchSize = 100;
    let successCount = 0;

    for (let i = 0; i < pushTokens.length; i += batchSize) {
      const batch = pushTokens.slice(i, i + batchSize);
      
      const messages = batch.map((token) => ({
        to: token,
        sound: 'default',
        title,
        body,
        data: data || {},
        priority: 'high',
        channelId: 'default',
      }));

      try {
        const response = await fetch(this.expoPushApiUrl, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Accept-Encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(messages),
        });

        if (!response.ok) {
          const error = await response.text();
          this.logger.error(`Failed to send batch push notifications: ${error}`);
          continue;
        }

        const results = await response.json();
        
        // Подсчитываем успешные отправки
        if (Array.isArray(results.data)) {
          successCount += results.data.filter(
            (result: any) => result.status === 'ok'
          ).length;
        } else if (results.data?.status === 'ok') {
          successCount += batch.length;
        }
      } catch (error) {
        this.logger.error(`Error sending batch push notifications: ${error.message}`);
      }
    }

    this.logger.log(`Sent ${successCount} push notifications to masters`);
    return successCount;
  }
}

