import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';

@Controller('moderation')
@UseGuards(JwtAuthGuard, AdminGuard)
export class ModerationController {
  constructor(private readonly moderation: ModerationService) {}

  @Get('queue')
  async getQueue(
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.moderation.getQueue({
      limit: limit ? parseInt(limit, 10) : 50,
      offset: offset ? parseInt(offset, 10) : 0,
    });
  }

  @Get('stats')
  async getStats() {
    return this.moderation.getStats();
  }

  @Post(':id/approve')
  async approve(@Param('id') id: string, @Req() req: any) {
    const adminId = req.user?.sub || req.user?.id;
    return this.moderation.approveListing(id, adminId);
  }

  @Post(':id/reject')
  async reject(
    @Param('id') id: string,
    @Body() body: { reason?: string },
    @Req() req: any,
  ) {
    const adminId = req.user?.sub || req.user?.id;
    if (!body?.reason?.trim()) {
      throw new BadRequestException('سبب الرفض مطلوب');
    }
    return this.moderation.rejectListing(id, adminId, body.reason.trim());
  }
}
