import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CreateStoryImageDto } from './dto/create-story-image.dto';
import { UpdateStoryImageDto } from './dto/update-story-image.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  // Публичные endpoints
  @Get()
  async getActiveStories() {
    return this.storiesService.getActiveStories();
  }

  @Get(':id')
  async getStoryById(@Param('id') id: string) {
    return this.storiesService.getStoryById(id);
  }

  // Админские endpoints для stories
  @Post('admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async createStory(@Body() createStoryDto: CreateStoryDto) {
    return this.storiesService.createStory(createStoryDto);
  }

  @Get('admin/all')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getAllStories() {
    return this.storiesService.getAllStories();
  }

  @Patch('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateStory(@Param('id') id: string, @Body() updateStoryDto: UpdateStoryDto) {
    return this.storiesService.updateStory(id, updateStoryDto);
  }

  @Delete('admin/:id')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteStory(@Param('id') id: string) {
    return this.storiesService.deleteStory(id);
  }

  // Админские endpoints для story images
  @Post('admin/:storyId/images')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async addImageToStory(@Param('storyId') storyId: string, @Body() createStoryImageDto: CreateStoryImageDto) {
    return this.storiesService.addImageToStory(storyId, createStoryImageDto);
  }

  @Patch('admin/images/:imageId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async updateStoryImage(@Param('imageId') imageId: string, @Body() updateStoryImageDto: UpdateStoryImageDto) {
    return this.storiesService.updateStoryImage(imageId, updateStoryImageDto);
  }

  @Delete('admin/images/:imageId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async deleteStoryImage(@Param('imageId') imageId: string) {
    return this.storiesService.deleteStoryImage(imageId);
  }
}

