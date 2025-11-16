import { IsString, IsNotEmpty, IsEnum, IsOptional, IsArray } from 'class-validator';

export enum GenerateType {
  SLUG = 'slug',
  DESCRIPTION = 'description',
}

export class GenerateAiDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEnum(GenerateType)
  type: GenerateType;

  @IsString()
  @IsNotEmpty()
  entityType: 'category' | 'service';

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[]; // Массив названий категорий от корня к текущей
}

