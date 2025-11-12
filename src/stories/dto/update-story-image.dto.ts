import { IsString, IsOptional, IsInt, Min } from 'class-validator';

export class UpdateStoryImageDto {
  @IsString()
  @IsOptional()
  image?: string;

  @IsString()
  @IsOptional()
  title?: string;

  @IsInt()
  @Min(0)
  @IsOptional()
  duration?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  order?: number;
}

