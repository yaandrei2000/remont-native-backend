import { Module } from '@nestjs/common';
import { BugReportsController } from './bug-reports.controller';
import { BugReportsService } from './bug-reports.service';
import { PrismaModule } from '../prisma/prisma.module';
import { StorageModule } from '../libs/storage/storage.module';

@Module({
  imports: [PrismaModule, StorageModule],
  controllers: [BugReportsController],
  providers: [BugReportsService],
  exports: [BugReportsService],
})
export class BugReportsModule {}


