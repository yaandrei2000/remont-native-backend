import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UsePipes,
  ValidationPipe,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AdminService } from './admin.service';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ApproveMasterApplicationDto } from './dto/approve-master-application.dto';
import { GenerateAiDto } from './dto/generate-ai.dto';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly aiService: AiService,
  ) {}

  // ========== USERS ==========
  @Get('users')
  async getUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    return this.adminService.getUsers(pagination, search);
  }

  @Get('users/:id')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('users/:id')
  async updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.adminService.updateUser(id, dto);
  }

  @Delete('users/:id')
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  // ========== ORDERS ==========
  @Get('orders')
  async getOrders(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('masterId') masterId?: string,
    @Query('clientId') clientId?: string,
  ) {
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    return this.adminService.getOrders(pagination, { status, masterId, clientId });
  }

  @Get('orders/:id')
  async getOrderById(@Param('id') id: string) {
    return this.adminService.getOrderById(id);
  }

  @Put('orders/:id')
  async updateOrder(@Param('id') id: string, @Body() dto: UpdateOrderDto) {
    return this.adminService.updateOrder(id, dto);
  }

  // ========== MASTERS ==========
  @Get('masters')
  async getMasters(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isActive') isActive?: string,
    @Query('cityId') cityId?: string,
  ) {
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    const filters: any = {};
    if (isActive !== undefined) {
      filters.isActive = isActive === 'true';
    }
    if (cityId) {
      filters.cityId = cityId;
    }
    return this.adminService.getMasters(pagination, filters);
  }

  @Post('masters/:id/approve')
  async approveMaster(@Param('id') id: string) {
    return this.adminService.approveMaster(id);
  }

  @Post('masters/:id/block')
  async blockMaster(@Param('id') id: string) {
    return this.adminService.blockMaster(id);
  }

  // ========== CATEGORIES ==========
  @Get('categories')
  async getCategories() {
    return this.adminService.getCategories();
  }

  @Get('categories/:id')
  async getCategoryById(@Param('id') id: string) {
    return this.adminService.getCategoryById(id);
  }

  @Post('categories')
  @UseInterceptors(FileInterceptor('image'))
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, transform: true }))
  async createCategory(
    @Body() body: any,
    @UploadedFile() image?: any,
  ) {
    // При использовании FileInterceptor, body приходит как объект с полями
    const dto: CreateCategoryDto = {
      name: body.name,
      slug: body.slug,
      description: body.description || undefined,
      icon: body.icon || undefined,
      image: body.image || undefined,
      parentId: body.parentId || undefined, // ID родительской категории (необязательно)
    };
    return this.adminService.createCategory(dto, image);
  }

  @Put('categories/:id')
  @UseInterceptors(FileInterceptor('image'))
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, transform: true }))
  async updateCategory(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() image?: any,
  ) {
    // Обрабатываем parentId: если передана пустая строка, это означает null (корневая категория)
    let parentId: string | null | undefined = undefined;
    if (body.parentId !== undefined) {
      parentId = body.parentId === '' || body.parentId === null ? null : body.parentId;
    }
    
    const dto: UpdateCategoryDto = {
      name: body.name,
      slug: body.slug,
      description: body.description || undefined,
      icon: body.icon || undefined,
      image: body.image || undefined,
      parentId: parentId, // ID родительской категории (null для корневых)
    };
    return this.adminService.updateCategory(id, dto, image);
  }

  @Delete('categories/:id')
  async deleteCategory(@Param('id') id: string) {
    return this.adminService.deleteCategory(id);
  }

  // ========== SERVICES ==========
  @Get('services')
  async getServices(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    return this.adminService.getServices(pagination, categoryId);
  }

  @Get('services/:id')
  async getServiceById(@Param('id') id: string) {
    return this.adminService.getServiceById(id);
  }

  @Post('services')
  @UseInterceptors(FileInterceptor('image'))
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, transform: true }))
  async createService(
    @Body() body: any,
    @UploadedFile() image?: any,
  ) {
    // При использовании FileInterceptor, body приходит как объект с полями
    const dto: CreateServiceDto = {
      name: body.name,
      slug: body.slug,
      description: body.description || undefined,
      price: body.price ? parseFloat(body.price) : undefined,
      categoryId: body.categoryId,
      time: body.time || undefined,
      image: body.image || undefined,
    };
    return this.adminService.createService(dto, image);
  }

  @Put('services/:id')
  @UseInterceptors(FileInterceptor('image'))
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, transform: true }))
  async updateService(
    @Param('id') id: string,
    @Body() body: any,
    @UploadedFile() image?: any,
  ) {
    const dto: UpdateServiceDto = {
      name: body.name,
      slug: body.slug,
      description: body.description || undefined,
      price: body.price ? parseFloat(body.price) : undefined,
      categoryId: body.categoryId,
      time: body.time || undefined,
      image: body.image || undefined,
    };
    return this.adminService.updateService(id, dto, image);
  }

  @Delete('services/:id')
  async deleteService(@Param('id') id: string) {
    return this.adminService.deleteService(id);
  }

  // ========== SERVICE CITIES MANAGEMENT ==========
  @Get('cities')
  async getCities() {
    return this.adminService.getCities();
  }

  @Get('cities/:cityId/services')
  async getCityServices(@Param('cityId') cityId: string) {
    return this.adminService.getCityServices(cityId);
  }

  @Post('cities/:cityId/services')
  async manageCityServices(
    @Param('cityId') cityId: string,
    @Body() body: { serviceIds: string[] },
  ) {
    return this.adminService.manageCityServices(cityId, body.serviceIds);
  }

  @Post('services/:serviceId/cities')
  async manageServiceCities(
    @Param('serviceId') serviceId: string,
    @Body() body: { cityIds: string[] },
  ) {
    return this.adminService.manageServiceCities(serviceId, body.cityIds);
  }

  // ========== MASTER APPLICATIONS ==========
  @Get('master-applications')
  async getMasterApplications(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    return this.adminService.getMasterApplications(pagination, status);
  }

  @Get('master-applications/:id')
  async getMasterApplicationById(@Param('id') id: string) {
    return this.adminService.getMasterApplicationById(id);
  }

  @Post('master-applications/:id/approve')
  async approveMasterApplication(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.approveMasterApplication(id, admin.id);
  }

  @Post('master-applications/:id/reject')
  async rejectMasterApplication(
    @Param('id') id: string,
    @CurrentUser() admin: any,
    @Body() dto: ApproveMasterApplicationDto,
  ) {
    return this.adminService.rejectMasterApplication(id, admin.id, dto.rejectionReason);
  }

  @Post('users/:id/demote')
  async demoteMaster(
    @Param('id') id: string,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.demoteMaster(id, admin.id);
  }

  // ========== AI GENERATION ==========
  @Post('ai/generate')
  @UsePipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }))
  async generateAi(@Body() dto: GenerateAiDto) {
    if (dto.type === 'slug') {
      const slug = await this.aiService.generateSlug(dto.name);
      return { result: slug };
    } else if (dto.type === 'description') {
      const description = await this.aiService.generateDescription(dto.name, dto.entityType, dto.categories);
      return { result: description };
    }
    throw new BadRequestException('Invalid type');
  }

  // ========== STATISTICS ==========
  @Get('statistics')
  async getStatistics() {
    return this.adminService.getStatistics();
  }
}

