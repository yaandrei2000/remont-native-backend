import { IsString, IsOptional } from 'class-validator';

export class UpdatePushTokenDto {
  @IsString()
  @IsOptional()
  pushToken?: string;
}


