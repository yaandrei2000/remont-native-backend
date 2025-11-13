import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ServicesModule } from './services/services.module';
import { OrdersModule } from './orders/orders.module';
import { CitiesModule } from './cities/cities.module';
import { AdminModule } from './admin/admin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { PrismaModule } from './prisma/prisma.module';
import { StorageModule } from './libs/storage/storage.module';
import { PromoCodesModule } from './promo-codes/promo-codes.module';
import { ReferralsModule } from './referrals/referrals.module';
import { ChatsModule } from './chats/chats.module';
import { HomePageModule } from './home-page/home-page.module';
import { StoriesModule } from './stories/stories.module';
import { BugReportsModule } from './bug-reports/bug-reports.module';
import { RedisModule } from './libs/redis/redis.module';
import { SessionsModule } from './sessions/sessions.module';
import { ReviewsModule } from './reviews/reviews.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
    RedisModule,
    SessionsModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    OrdersModule,
    CitiesModule,
    AdminModule,
    NotificationsModule,
    PromoCodesModule,
    ReferralsModule,
    ChatsModule,
    HomePageModule,
    StoriesModule,
    BugReportsModule,
    ReviewsModule,
  ]
})
export class AppModule {}
