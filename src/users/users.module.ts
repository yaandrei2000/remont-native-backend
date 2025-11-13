import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';
import { StorageModule } from '../libs/storage/storage.module';
import { SessionsModule } from '../sessions/sessions.module';

@Module({
  imports: [StorageModule, SessionsModule],
  controllers: [UsersController],
  providers: [UsersService, PrismaService],
  exports: [UsersService],
})
export class UsersModule {}



