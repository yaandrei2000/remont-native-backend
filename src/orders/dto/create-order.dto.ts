import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsArray, ValidateNested, IsEnum, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderUrgency {
  URGENT = 'URGENT',
  SCHEDULED = 'SCHEDULED',
}

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  serviceId: string;

  @IsOptional()
  quantity?: number = 1;
}

export class CreateOrderDto {
  @IsString()
  @IsNotEmpty()
  recipient: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  clientPhone: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsOptional()
  apartment?: string;

  @IsBoolean()
  @IsOptional()
  isPrivateHouse?: boolean = false;

  @IsEnum(OrderUrgency)
  @IsOptional()
  urgency?: OrderUrgency = OrderUrgency.URGENT;

  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @IsString()
  @IsOptional()
  scheduledTime?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}



