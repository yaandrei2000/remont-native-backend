import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class ManageServiceCitiesDto {
  @IsString()
  @IsNotEmpty()
  cityId: string;

  @IsArray()
  @IsString({ each: true })
  serviceIds: string[];
}


