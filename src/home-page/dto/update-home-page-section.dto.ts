import { IsString, IsOptional, IsBoolean, IsInt, Min } from 'class-validator';

export class UpdateHomePageSectionDto {
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

