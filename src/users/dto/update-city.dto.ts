import { IsString, IsOptional } from 'class-validator';

export class UpdateCityDto {
  @IsString()
  @IsOptional()
  cityId?: string;
}



