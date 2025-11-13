import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateSectionItemDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}


