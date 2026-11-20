import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import { PaymentsService } from './payments.service';
import { PromotionsService } from './promotions.service';
import { PaymentMethod } from '@prisma/client';

@Controller('v1/payments')
export class PaymentsController {
  constructor(
    private payments: PaymentsService,
    private promotions: PromotionsService,
  ) {}

  @Get('products')
  getProducts() {
    return this.payments.getProducts();
  }

  @Post('checkout')
  @UseGuards(JwtAuthGuard)
  checkout(
    @Request() req: any,
    @Body()
    body: {
      listingId: string;
      productId: string;
      paymentMethod: PaymentMethod;
    },
  ) {
    return this.payments.createTransaction(
      req.user.sub,
      body.listingId,
      body.productId,
      body.paymentMethod,
    );
  }

  @Get('my-transactions')
  @UseGuards(JwtAuthGuard)
  getMyTransactions(@Request() req: any) {
    return this.payments.getUserTransactions(req.user.sub);
  }

  @Get('promotion-status/:listingId')
  @UseGuards(JwtAuthGuard)
  getPromotionStatus(@Param('listingId') listingId: string) {
    return this.promotions.verifyPromotionStatus(listingId);
  }

  @Get('admin/revenue')
  @UseGuards(JwtAuthGuard, AdminGuard)
  getRevenue() {
    return this.payments.getRevenueStats();
  }

  @Patch('admin/approve/:transactionId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  approvePayment(@Request() req: any, @Param('transactionId') id: string) {
    return this.payments.approveManualPayment(id, req.user.sub);
  }

  @Patch('admin/reject/:transactionId')
  @UseGuards(JwtAuthGuard, AdminGuard)
  rejectPayment(
    @Request() req: any,
    @Param('transactionId') id: string,
    @Body() body: { reason: string },
  ) {
    return this.payments.rejectManualPayment(id, req.user.sub, body.reason);
  }
}
