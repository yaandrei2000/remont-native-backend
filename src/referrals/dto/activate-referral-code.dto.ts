import { IsString, IsNotEmpty } from 'class-validator';

export class ActivateReferralCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

