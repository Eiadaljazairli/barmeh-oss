import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Patch,
  Param,
  Request,
} from '@nestjs/common';
import { MerchantService } from './merchant.service';
import {
  UpgradeMerchantDto,
  UpdateMerchantProfileDto,
} from './dto/merchant.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import type { AuthRequest } from '../auth/auth.types';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Merchant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('merchant')
export class MerchantController {
  constructor(private readonly merchantService: MerchantService) {}

  @Post('upgrade')
  @ApiOperation({ summary: 'Upgrade personal account to business account' })
  async upgrade(@Request() req: AuthRequest, @Body() dto: UpgradeMerchantDto) {
    return this.merchantService.upgradeToMerchant(req.user.sub, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current user merchant profile' })
  async getMyProfile(@Request() req: AuthRequest) {
    return this.merchantService.getProfile(req.user.sub);
  }

  @Put('me')
  @ApiOperation({ summary: 'Update current user merchant profile' })
  async updateMyProfile(
    @Request() req: AuthRequest,
    @Body() dto: UpdateMerchantProfileDto,
  ) {
    return this.merchantService.updateProfile(req.user.sub, dto);
  }

  @Get('admin/pending')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get pending merchant verifications (Admin Only)' })
  async getPending() {
    return this.merchantService.getPendingVerifications();
  }

  @Patch('admin/verify/:id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Verify a merchant profile (Admin Only)' })
  async verify(@Param('id') id: string) {
    return this.merchantService.verifyMerchant(id);
  }
}
