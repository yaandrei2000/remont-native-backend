import { Controller, Post, Get, Body, Param, UseGuards, Query } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto/create-review.dto';
import { UsePipes, ValidationPipe } from '@nestjs/common';

@Controller('reviews')
@UseGuards(JwtAuthGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ transform: true }))
  async createReview(@CurrentUser() user: any, @Body() dto: CreateReviewDto) {
    return this.reviewsService.createReview(user.id, dto);
  }

  @Get('service/:serviceId')
  async getServiceReviews(
    @Param('serviceId') serviceId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.reviewsService.getServiceReviews(
      serviceId,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('order/:orderId')
  async getOrderReview(@Param('orderId') orderId: string) {
    return this.reviewsService.getOrderReview(orderId);
  }

  @Get('service/:serviceId/masters')
  async getServiceMasters(
    @Param('serviceId') serviceId: string,
    @Query('cityId') cityId?: string,
  ) {
    return this.reviewsService.getServiceMasters(serviceId, cityId);
  }
}

