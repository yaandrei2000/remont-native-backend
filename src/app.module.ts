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

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    StorageModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    OrdersModule,
    CitiesModule,
    AdminModule,
    NotificationsModule,
    PromoCodesModule,
    ReferralsModule,
  ]
})
export class AppModule {}
