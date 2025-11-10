import { Controller, Get, Param, Query } from '@nestjs/common';
import { ServicesService } from './services.service';
import { PaginationDto } from '../common/dto/pagination.dto';

@Controller('services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Get('categories')
  async getCategories() {
    return this.servicesService.getCategories();
  }

  @Get('categories/:categorySlug')
  async getServicesByCategory(
    @Param('categorySlug') categorySlug: string,
    @Query() pagination: PaginationDto,
  ) {
    return this.servicesService.getServicesByCategory(categorySlug, pagination);
  }

  @Get('categories/:categorySlug/services/:serviceSlug')
  async getService(
    @Param('categorySlug') categorySlug: string,
    @Param('serviceSlug') serviceSlug: string,
  ) {
    return this.servicesService.getService(categorySlug, serviceSlug);
  }

  @Get('search')
  async searchServices(@Query('q') query: string, @Query() pagination: PaginationDto) {
    return this.servicesService.searchServices(query, pagination);
  }
}



