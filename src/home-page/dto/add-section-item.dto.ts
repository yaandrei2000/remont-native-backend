import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class AddSectionItemDto {
  @IsString()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  serviceId?: string;

  @IsString()
  @IsOptional()
  imageUrl?: string; // URL изображения для промо-карточки

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}


