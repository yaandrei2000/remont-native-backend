import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { PromoCodesService } from './promo-codes.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActivatePromoCodeDto } from './dto/activate-promo-code.dto';

@Controller('promo-codes')
export class PromoCodesController {
  constructor(private readonly promoCodesService: PromoCodesService) {}

  @Get()
  async getAllPromoCodes() {
    try {
      return await this.promoCodesService.getAllPromoCodes();
    } catch (error) {
      console.error('Error in getAllPromoCodes:', error);
      throw error;
    }
  }

  @Post('activate')
  @UseGuards(JwtAuthGuard)
  async activatePromoCode(
    @CurrentUser() user: any,
    @Body() dto: ActivatePromoCodeDto,
  ) {
    return this.promoCodesService.activatePromoCode(user.id, dto.code);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  async getUserPromoCodes(@CurrentUser() user: any) {
    return this.promoCodesService.getUserPromoCodes(user.id);
  }
}

