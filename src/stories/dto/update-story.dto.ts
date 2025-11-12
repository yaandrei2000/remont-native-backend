import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateStoryDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  image?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

