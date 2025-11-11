import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ReferralsService } from './referrals.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ActivateReferralCodeDto } from './dto/activate-referral-code.dto';

@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getReferralStats(@CurrentUser() user: any) {
    return this.referralsService.getReferralStats(user.id);
  }

  @Post('activate')
  @UseGuards(JwtAuthGuard)
  async activateReferralCode(
    @CurrentUser() user: any,
    @Body() dto: ActivateReferralCodeDto,
  ) {
    return this.referralsService.activateReferralCode(user.id, dto.code);
  }

  @Get('code')
  @UseGuards(JwtAuthGuard)
  async getReferralCode(@CurrentUser() user: any) {
    const code = await this.referralsService.getOrCreateReferralCode(user.id);
    return { referralCode: code };
  }
}

