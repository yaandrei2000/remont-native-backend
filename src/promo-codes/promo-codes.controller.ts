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
    return this.promoCodesService.getAllPromoCodes();
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

