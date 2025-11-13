import { Controller, Get, Patch, Post, Body, UseGuards, UseInterceptors, UploadedFile, UsePipes, ValidationPipe } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdatePushTokenDto } from './dto/update-push-token.dto';
import { CreateMasterApplicationDto } from '../admin/dto/create-master-application.dto';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getProfile(@CurrentUser() user: any) {
    return this.usersService.getProfile(user.id);
  }

  @Patch('me')
  @UseInterceptors(FileInterceptor('avatar'))
  @UsePipes(new ValidationPipe({ skipMissingProperties: true, transform: true }))
  async updateProfile(
    @CurrentUser() user: any,
    @Body() body: any,
    @UploadedFile() avatarFile?: Express.Multer.File,
  ) {
    const dto: UpdateProfileDto = {
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email,
      avatar: body.avatar,
    };
    return this.usersService.updateProfile(user.id, dto, avatarFile);
  }

  @Patch('me/city')
  async updateCity(@CurrentUser() user: any, @Body('cityId') cityId: string) {
    return this.usersService.updateCity(user.id, cityId);
  }

  @Patch('me/push-token')
  async updatePushToken(@CurrentUser() user: any, @Body() dto: UpdatePushTokenDto) {
    return this.usersService.updatePushToken(user.id, dto.pushToken || null);
  }

  @Get('me/master-application')
  async getMasterApplication(@CurrentUser() user: any) {
    return this.usersService.getMasterApplication(user.id);
  }

  @Post('me/master-application')
  async createMasterApplication(@CurrentUser() user: any, @Body() dto: CreateMasterApplicationDto) {
    return this.usersService.createMasterApplication(user.id, dto);
  }
}

