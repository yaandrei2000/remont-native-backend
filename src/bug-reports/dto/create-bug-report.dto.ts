import { IsEnum, IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export enum BugReportCategory {
  UI = 'UI',
  PERFORMANCE = 'PERFORMANCE',
  FUNCTIONALITY = 'FUNCTIONALITY',
  DATA = 'DATA',
  OTHER = 'OTHER',
}

export enum BugReportPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export class CreateBugReportDto {
  @IsEnum(BugReportCategory)
  @IsNotEmpty()
  category: BugReportCategory;

  @IsEnum(BugReportPriority)
  @IsOptional()
  priority?: BugReportPriority;

  @IsString()
  @IsNotEmpty()
  @MaxLength(1000)
  description: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  steps?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}


