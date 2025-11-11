import { IsEnum, IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';
import { HomePageSectionType } from '@prisma/client';

export class CreateHomePageSectionDto {
  @IsEnum(HomePageSectionType)
  type: HomePageSectionType;

  @IsString()
  @IsOptional()
  title?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

