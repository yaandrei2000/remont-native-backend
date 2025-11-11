import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateMasterApplicationDto {
  @IsString()
  name: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  experience?: string;

  @IsArray()
  @IsString({ each: true })
  specialties: string[];

  @IsString()
  @IsOptional()
  description?: string;
}

