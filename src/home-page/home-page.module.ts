import { Module } from '@nestjs/common';
import { HomePageController } from './home-page.controller';
import { HomePageService } from './home-page.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [HomePageController],
  providers: [HomePageService],
  exports: [HomePageService],
})
export class HomePageModule {}

