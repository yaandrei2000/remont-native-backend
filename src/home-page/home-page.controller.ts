import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Patch,
} from '@nestjs/common';
import { HomePageService } from './home-page.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { CreateHomePageSectionDto } from './dto/create-home-page-section.dto';
import { UpdateHomePageSectionDto } from './dto/update-home-page-section.dto';
import { AddSectionItemDto } from './dto/add-section-item.dto';
import { UpdateSectionItemDto } from './dto/update-section-item.dto';
import { HomePageSectionType } from '@prisma/client';

@Controller('home-page')
export class HomePageController {
  constructor(private readonly homePageService: HomePageService) {}

  // Получить активные секции (публичный endpoint)
  @Get('sections')
  async getActiveSections() {
    return this.homePageService.getActiveSections();
  }

  // ========== ADMIN ENDPOINTS ==========

  // Получить все секции (для админа)
  @Get('admin/sections')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllSections() {
    return this.homePageService.getAllSections();
  }

  // Получить секцию по типу
  @Get('admin/sections/type/:type')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getSectionByType(@Param('type') type: HomePageSectionType) {
    return this.homePageService.getSectionByType(type);
  }

  // Создать секцию
  @Post('admin/sections')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createSection(@Body() dto: CreateHomePageSectionDto) {
    return this.homePageService.createSection(dto);
  }

  // Обновить секцию
  @Put('admin/sections/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateSection(
    @Param('id') id: string,
    @Body() dto: UpdateHomePageSectionDto,
  ) {
    return this.homePageService.updateSection(id, dto);
  }

  // Удалить секцию
  @Delete('admin/sections/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteSection(@Param('id') id: string) {
    return this.homePageService.deleteSection(id);
  }

  // Добавить элемент в секцию
  @Post('admin/sections/:sectionId/items')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async addSectionItem(
    @Param('sectionId') sectionId: string,
    @Body() dto: AddSectionItemDto,
  ) {
    return this.homePageService.addSectionItem(sectionId, dto);
  }

  // Обновить элемент секции
  @Put('admin/sections/items/:itemId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateSectionItem(
    @Param('itemId') itemId: string,
    @Body() dto: UpdateSectionItemDto,
  ) {
    return this.homePageService.updateSectionItem(itemId, dto);
  }

  // Удалить элемент секции
  @Delete('admin/sections/items/:itemId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async removeSectionItem(@Param('itemId') itemId: string) {
    return this.homePageService.removeSectionItem(itemId);
  }
}


