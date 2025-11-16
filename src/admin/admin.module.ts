import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AiService } from './ai.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [AdminController],
  providers: [AdminService, AiService, PrismaService],
  exports: [AdminService],
})
export class AdminModule {}


