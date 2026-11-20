import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { ModerationService } from '../moderation/moderation.service';

@Controller('reports')
export class ReportsController {
  constructor(
    private prisma: PrismaService,
    private moderation: ModerationService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async createReport(
    @Body()
    body: { listingId?: string; reportedUserId?: string; reason: string },
    @Req() req: any,
  ) {
    const reporterId = req.user?.sub || req.user?.id;
    if (!body.reason?.trim()) {
      throw new BadRequestException('سبب البلاغ مطلوب');
    }
    if (!body.listingId && !body.reportedUserId) {
      throw new BadRequestException('يجب تحديد إعلان أو مستخدم للبلاغ عليه');
    }

    try {
      const report = await this.prisma.report.create({
        data: {
          reporterId,
          listingId: body.listingId,
          reportedUserId: body.reportedUserId,
          reason: body.reason.trim(),
        },
      });

      if (body.listingId) {
        await this.moderation.onListingReported(body.listingId);
      }

      return { id: report.id, message: 'تم استلام البلاغ، سيتم مراجعته' };
    } catch (err: any) {
      if (err?.code === 'P2002') {
        throw new BadRequestException('لقد قمت بالإبلاغ على هذا العنصر مسبقاً');
      }
      throw err;
    }
  }

  @Get('admin/count')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async getCount() {
    const count = await this.prisma.report.count();
    return { count };
  }

  @Get('admin/list')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async listAll() {
    return this.prisma.report.findMany({
      include: {
        reporter: {
          select: { id: true, firstName: true, lastName: true },
        },
        listing: { select: { id: true, title: true } },
        reportedUser: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post('admin/:id/resolve')
  @UseGuards(JwtAuthGuard, AdminGuard)
  async resolve(@Param('id') id: string) {
    return this.prisma.report.delete({ where: { id } });
  }
}
