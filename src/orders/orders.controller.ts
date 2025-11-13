import { Controller, Get, Post, Body, Param, UseGuards, Query, Patch } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { CreateUrgentOrderDto } from './dto/create-urgent-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PaginationDto } from '../common/dto/pagination.dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    return this.ordersService.createOrder(dto, user?.id);
  }

  @Post('urgent')
  async createUrgentOrder(@Body() dto: CreateUrgentOrderDto) {
    return this.ordersService.createUrgentOrder(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async getOrders(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.ordersService.getUserOrders(user.id, pagination);
  }

  @Get('available')
  @UseGuards(JwtAuthGuard)
  async getAvailableOrders(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.ordersService.getAvailableOrders(user.id, pagination);
  }

  @Get('master')
  @UseGuards(JwtAuthGuard)
  async getMasterOrders(@CurrentUser() user: any, @Query() pagination: PaginationDto) {
    return this.ordersService.getMasterOrders(user.id, pagination);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async getOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getOrder(id, user.id);
  }

  @Get(':id/master')
  @UseGuards(JwtAuthGuard)
  async getOrderForMaster(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.getOrderForMaster(id, user.id);
  }

  @Patch(':id/assign')
  @UseGuards(JwtAuthGuard)
  async assignOrder(@Param('id') id: string, @CurrentUser() user: any) {
    return this.ordersService.assignOrder(id, user.id);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  async updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateOrderStatus(id, user.id, dto);
  }

  @Patch(':id/steps/:stepId')
  @UseGuards(JwtAuthGuard)
  async updateOrderStep(
    @Param('id') orderId: string,
    @Param('stepId') stepId: string,
    @Body('status') status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED',
    @CurrentUser() user: any,
  ) {
    return this.ordersService.updateOrderStep(orderId, stepId, user.id, status);
  }

  @Post(':id/cancel')
  @UseGuards(JwtAuthGuard)
  async cancelOrder(
    @Param('id') id: string,
    @Body() dto: CancelOrderDto,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.cancelOrderByClient(id, user.id, dto);
  }
}

