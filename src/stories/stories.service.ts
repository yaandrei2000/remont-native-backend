import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';
import { UpdateStoryDto } from './dto/update-story.dto';
import { CreateStoryImageDto } from './dto/create-story-image.dto';
import { UpdateStoryImageDto } from './dto/update-story-image.dto';

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  // Публичные методы для frontend
  async getActiveStories() {
    return this.prisma.story.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async getStoryById(id: string) {
    const story = await this.prisma.story.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    return story;
  }

  // Админские методы для stories
  async createStory(dto: CreateStoryDto) {
    return this.prisma.story.create({ data: dto });
  }

  async getAllStories() {
    return this.prisma.story.findMany({
      orderBy: { order: 'asc' },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
      },
    });
  }

  async updateStory(id: string, dto: UpdateStoryDto) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    return this.prisma.story.update({ where: { id }, data: dto });
  }

  async deleteStory(id: string) {
    const story = await this.prisma.story.findUnique({ where: { id } });
    if (!story) {
      throw new NotFoundException(`Story with ID ${id} not found`);
    }
    return this.prisma.story.delete({ where: { id } });
  }

  // Админские методы для story images
  async addImageToStory(storyId: string, dto: CreateStoryImageDto) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) {
      throw new NotFoundException(`Story with ID ${storyId} not found`);
    }
    return this.prisma.storyImage.create({
      data: {
        storyId,
        ...dto,
      },
    });
  }

  async updateStoryImage(imageId: string, dto: UpdateStoryImageDto) {
    const image = await this.prisma.storyImage.findUnique({ where: { id: imageId } });
    if (!image) {
      throw new NotFoundException(`Story image with ID ${imageId} not found`);
    }
    return this.prisma.storyImage.update({ where: { id: imageId }, data: dto });
  }

  async deleteStoryImage(imageId: string) {
    const image = await this.prisma.storyImage.findUnique({ where: { id: imageId } });
    if (!image) {
      throw new NotFoundException(`Story image with ID ${imageId} not found`);
    }
    return this.prisma.storyImage.delete({ where: { id: imageId } });
  }
}

