import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('categories')
  async getCategories(
    @Query('cityId') cityId?: string,
    @Query('parentId') parentId?: string,
  ) {
    return this.servicesService.getCategories(cityId, parentId);
  }

  @Get('categories/:categorySlug')
  async getServicesByCategory(
    @Param('categorySlug') categorySlug: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('cityId') cityId?: string,
    @Query('parentSlug') parentSlug?: string,
  ) {
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    return this.servicesService.getServicesByCategory(categorySlug, pagination, cityId, parentSlug);
  }

  @Get('categories/:parentSlug/:categorySlug/services/:serviceSlug')
  async getServiceWithParent(
    @Param('parentSlug') parentSlug: string,
    @Param('categorySlug') categorySlug: string,
    @Param('serviceSlug') serviceSlug: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.servicesService.getService(categorySlug, serviceSlug, cityId, parentSlug);
  }

  @Get('categories/:categorySlug/services/:serviceSlug')
  async getService(
    @Param('categorySlug') categorySlug: string,
    @Param('serviceSlug') serviceSlug: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.servicesService.getService(categorySlug, serviceSlug, cityId);
  }

  @Get('search')
  async searchServices(
    @Query('q') query: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('cityId') cityId?: string,
  ) {
    const pagination: PaginationDto = {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
    };
    return this.servicesService.searchServices(query, pagination, cityId);
  }
}



