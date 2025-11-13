import { Controller, Post, Body, Req } from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import { SendCodeDto, VerifyCodeDto, RefreshTokenDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  async sendCode(@Body() dto: SendCodeDto) {
    return this.authService.sendCode(dto);
  }

  @Post('verify-code')
  async verifyCode(@Body() dto: VerifyCodeDto, @Req() req: Request) {
    // Извлекаем IP адрес и обрабатываем IPv4-mapped IPv6 формат
    let ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'Unknown';
    
    // Обрабатываем IPv4-mapped IPv6 адрес (::ffff:192.168.0.101 -> 192.168.0.101)
    if (ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.replace('::ffff:', '');
    }

    const metadata = {
      deviceInfo: dto.deviceInfo,
      deviceModel: dto.deviceModel,
      deviceName: dto.deviceName,
      osName: dto.osName,
      osVersion: dto.osVersion,
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    return this.authService.verifyCode(dto, metadata);
  }

  @Post('refresh')
  async refreshToken(@Body() dto: RefreshTokenDto, @Req() req: Request) {
    console.log('Refresh token request received');
    
    // Извлекаем IP адрес и обрабатываем IPv4-mapped IPv6 формат
    let ipAddress = 
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (req.headers['x-real-ip'] as string) ||
      req.ip ||
      req.socket.remoteAddress ||
      'Unknown';
    
    // Обрабатываем IPv4-mapped IPv6 адрес (::ffff:192.168.0.101 -> 192.168.0.101)
    if (ipAddress.startsWith('::ffff:')) {
      ipAddress = ipAddress.replace('::ffff:', '');
    }

    const metadata = {
      ipAddress,
      userAgent: req.headers['user-agent'] || 'Unknown',
    };

    return this.authService.refreshToken(dto, metadata);
  }
}



