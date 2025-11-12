import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import { BugReportsService } from './bug-reports.service';
import { CreateBugReportDto } from './dto/create-bug-report.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('bug-reports')
export class BugReportsController {
  constructor(private readonly bugReportsService: BugReportsService) {}

  @Post()
  @UseInterceptors(AnyFilesInterceptor())
  async createBugReport(
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    const userId = user?.id || null;
    
    // Парсим данные из body (при multipart/form-data данные приходят как поля формы)
    const dto: CreateBugReportDto = {
      category: body.category,
      priority: body.priority || 'MEDIUM',
      description: body.description,
      steps: body.steps || undefined,
      email: body.email,
    };

    if (!dto.category || !dto.description || !dto.email) {
      throw new BadRequestException('Необходимо указать category, description и email');
    }
    
    // Разделяем файлы на изображения и лог-файл
    const images: Express.Multer.File[] = [];
    let logFile: Express.Multer.File | undefined;

    if (files && files.length > 0) {
      for (const file of files) {
        if (file.fieldname === 'images' || file.fieldname.startsWith('images')) {
          images.push(file);
        } else if (file.fieldname === 'logFile' || file.fieldname.startsWith('logFile')) {
          logFile = file;
        }
      }
    }

    // Проверяем количество изображений
    if (images.length > 10) {
      throw new BadRequestException('Максимум 10 изображений разрешено');
    }

    return this.bugReportsService.createBugReport(userId, dto, images, logFile);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getBugReports(@CurrentUser() user: any, @Query('my') my?: string) {
    const userId = my === 'true' ? user.id : undefined;
    return this.bugReportsService.getBugReports(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getBugReportById(@Param('id') id: string, @CurrentUser() user: any) {
    const userId = user.role === 'ADMIN' ? undefined : user.id;
    return this.bugReportsService.getBugReportById(id, userId);
  }

  // ========== ADMIN ENDPOINTS ==========

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllBugReports(@Query('status') status?: string) {
    return this.bugReportsService.getAllBugReports(status);
  }

  @Get('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAdminBugReportById(@Param('id') id: string) {
    return this.bugReportsService.getBugReportById(id);
  }

  @Patch('admin/:id/status')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateBugReportStatus(
    @Param('id') id: string,
    @Body() body: { status: 'NEW' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' },
  ) {
    return this.bugReportsService.updateBugReportStatus(id, body.status);
  }
}

