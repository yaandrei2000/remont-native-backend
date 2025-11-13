import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUrgentOrderDto {
  @IsString()
  @IsNotEmpty()
  phone: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  city?: string;
}

