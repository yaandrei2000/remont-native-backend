import { IsString, IsNotEmpty, IsOptional, Length, Matches } from 'class-validator';

export class SendCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+7\s?\d{3}\s?\d{3}-?\d{2}-?\d{2}$/, {
    message: 'Phone must be in format +7 XXX XXX-XX-XX',
  })
  phone: string;
}

export class VerifyCodeDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\+7\s?\d{3}\s?\d{3}-?\d{2}-?\d{2}$/, {
    message: 'Phone must be in format +7 XXX XXX-XX-XX',
  })
  phone: string;

  @IsString()
  @IsNotEmpty()
  @Length(4, 4)
  code: string;

  @IsString()
  @IsNotEmpty()
  deviceInfo: string;

  @IsString()
  @IsOptional()
  deviceModel?: string;

  @IsString()
  @IsOptional()
  deviceName?: string;

  @IsString()
  @IsOptional()
  osName?: string;

  @IsString()
  @IsOptional()
  osVersion?: string;
}

export class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}



