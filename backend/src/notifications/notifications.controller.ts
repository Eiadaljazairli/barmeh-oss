import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import type { AuthRequest } from '../auth/auth.types';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  findAll(@Request() req: AuthRequest) {
    return this.notificationsService.findAll(req.user.sub);
  }

  @Post(':id/read')
  @UseGuards(JwtAuthGuard)
  markAsRead(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.notificationsService.markAsRead(id, req.user.sub);
  }

  @Post('read-all')
  @UseGuards(JwtAuthGuard)
  markAllAsRead(@Request() req: AuthRequest) {
    return this.notificationsService.markAllAsRead(req.user.sub);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  deleteOne(@Param('id') id: string, @Request() req: AuthRequest) {
    return this.notificationsService.deleteOne(id, req.user.sub);
  }

  @Delete()
  @UseGuards(JwtAuthGuard)
  deleteAll(@Request() req: AuthRequest) {
    return this.notificationsService.deleteAll(req.user.sub);
  }

  @Post('admin/broadcast')
  @UseGuards(JwtAuthGuard, AdminGuard)
  broadcast(
    @Body()
    data: {
      title: string;
      body: string;
      target: 'all' | 'merchants' | 'consumers';
    },
  ) {
    return this.notificationsService.broadcast(data);
  }
}
