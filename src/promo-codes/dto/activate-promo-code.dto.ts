import { IsString, IsNotEmpty } from 'class-validator';

export class ActivatePromoCodeDto {
  @IsString()
  @IsNotEmpty()
  code: string;
}

