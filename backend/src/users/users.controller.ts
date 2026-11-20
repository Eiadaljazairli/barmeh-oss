import {
  Controller,
  Delete,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { SupportTicketDto } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { SessionsService } from '../auth/sessions.service';
import type { AuthRequest } from '../auth/auth.types';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

  @Get('admin/count')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getCount() {
    const count = await this.usersService.countAll();
    return { count };
  }

  @Get('admin/support-count')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getSupportCount() {
    const count = await this.usersService.countSupportTickets();
    return { count };
  }

  @Get('admin/support-list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listSupportTickets() {
    return this.usersService.findAllSupportTickets();
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listAll() {
    return this.usersService.findAllAdmin();
  }

  @Post('admin/:id/toggle-block')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async toggleBlock(@Param('id') userId: string) {
    return this.usersService.toggleBlock(userId);
  }

  @Post('admin/:id/toggle-admin')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HttpCode(HttpStatus.OK)
  async toggleAdmin(@Param('id') userId: string) {
    return this.usersService.toggleAdmin(userId);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getMe(@Request() req: AuthRequest) {
    return this.usersService.getMe(req.user.sub);
  }

  @Get('me/stats')
  @UseGuards(JwtAuthGuard)
  getMeStats(@Request() req: AuthRequest) {
    return this.usersService.getMeStats(req.user.sub);
  }

  @Get(':id/public')
  async getPublicProfile(@Param('id') userId: string) {
    return this.usersService.getPublicProfile(userId);
  }

  @Post('me')
  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfile(
    @Request() req: AuthRequest,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      req.user.sub,
      body,
      req.user.isAdmin,
      req.user.jti,
    );
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateProfilePatch(
    @Request() req: AuthRequest,
    @Body() body: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(
      req.user.sub,
      body,
      req.user.isAdmin,
      req.user.jti,
    );
  }

  @Delete('me')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteMe(@Request() req: AuthRequest): Promise<void> {
    await this.usersService.deleteAccount(req.user.sub);
  }

  @Post('me/location')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateLocation(
    @Request() req: AuthRequest,
    @Body() body: { lat: number; lng: number },
  ) {
    if (body.lat === undefined || body.lng === undefined) {
      throw new BadRequestException('إحداثيات الموقع مطلوبة');
    }
    await this.usersService.updateLocation(req.user.sub, body.lat, body.lng);
    return { message: 'تم تحديث الموقع بنجاح' };
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 3, ttl: 3600_000 } })
  @HttpCode(HttpStatus.OK)
  async reportUser(
    @Request() req: AuthRequest,
    @Param('id') reportedUserId: string,
    @Body('reason') reason: string,
  ) {
    if (!reason || reason.trim().length < 5) {
      throw new BadRequestException('سبب البلاغ قصير جداً');
    }
    await this.usersService.reportUser(
      req.user.sub,
      reportedUserId,
      reason.trim(),
    );
    return { message: 'تم استلام البلاغ بنجاح، شكراً لك.' };
  }

  @Post('support')
  @UseGuards(JwtAuthGuard)
  @Throttle({ default: { limit: 5, ttl: 3600_000 } })
  async createSupportTicket(
    @Request() req: AuthRequest,
    @Body() body: SupportTicketDto,
  ) {
    return this.usersService.createSupportTicket(req.user.sub, body);
  }

  @Post('support/:ticketId/reply')
  @UseGuards(JwtAuthGuard)
  async replyToTicket(
    @Request() req: AuthRequest,
    @Param('ticketId') ticketId: string,
    @Body()
    body: {
      content: string;
      attachments?: { fileUrl: string; fileType: string }[];
    },
  ) {
    return this.usersService.replyToTicket(req.user.sub, ticketId, body);
  }

  @Post('support/:ticketId/escalate')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async escalateTicketToPolice(@Param('ticketId') ticketId: string) {
    return this.usersService.escalateTicketToPolice(ticketId);
  }

  @Post('push-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async savePushToken(
    @Request() req: AuthRequest,
    @Body('token') token: string,
  ) {
    if (!token) throw new BadRequestException('Token is required');
    return this.usersService.savePushToken(req.user.sub, token);
  }

  @Delete('push-token')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async deletePushToken(
    @Request() req: AuthRequest,
    @Body('token') token?: string,
  ) {
    return this.usersService.deletePushToken(req.user.sub, token);
  }

  @Get('preferences')
  @UseGuards(JwtAuthGuard)
  async getPreferences(@Request() req: AuthRequest) {
    return this.usersService.getNotificationPreferences(req.user.sub);
  }

  @Post('preferences')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updatePreferences(@Request() req: AuthRequest, @Body() body: any) {
    return this.usersService.updateNotificationPreferences(req.user.sub, body);
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async blockUser(@Request() req: AuthRequest, @Param('id') targetId: string) {
    await this.usersService.blockUser(req.user.sub, targetId);
    return { success: true, message: 'تم حظر المستخدم بنجاح' };
  }

  @Post(':id/unblock')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async unblockUser(
    @Request() req: AuthRequest,
    @Param('id') targetId: string,
  ) {
    await this.usersService.unblockUser(req.user.sub, targetId);
    return { success: true, message: 'تم إلغاء حظر المستخدم بنجاح' };
  }

  @Get('blocks')
  @UseGuards(JwtAuthGuard)
  async getBlocks(@Request() req: AuthRequest) {
    return this.usersService.getBlockedUsers(req.user.sub);
  }

  @Get('me/sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@Request() req: AuthRequest) {
    return this.sessionsService.findActiveSessionsForUser(req.user.sub);
  }

  @Delete('me/sessions/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @Request() req: AuthRequest,
    @Param('id') sessionId: string,
  ) {
    const revoked = await this.sessionsService.revokeForUser(
      req.user.sub,
      sessionId,
      'user_revoked',
    );
    if (!revoked) throw new NotFoundException('الجلسة غير موجودة');
    return { message: 'تم إلغاء الجلسة بنجاح' };
  }

  @Delete('me/sessions')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(@Request() req: AuthRequest) {
    await this.sessionsService.revokeAllForUser(
      req.user.sub,
      'user_revoked_all',
    );
    return { message: 'تم إلغاء كل الجلسات بنجاح' };
  }
}
