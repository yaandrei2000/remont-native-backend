import { IsString, IsOptional } from 'class-validator';

export class ApproveMasterApplicationDto {
  @IsString()
  @IsOptional()
  rejectionReason?: string;
}

