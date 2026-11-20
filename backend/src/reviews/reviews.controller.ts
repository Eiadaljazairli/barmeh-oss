import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { AuthRequest } from '../auth/auth.types';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @Request() req: AuthRequest,
    @Body() dto: { reviewedUserId: string; rating: number; comment?: string },
  ) {
    return this.reviewsService.createReview(req.user.sub, dto);
  }

  @Get('user/:id')
  async getUserReviews(@Param('id') userId: string) {
    const reviews = await this.reviewsService.getUserReviews(userId);
    const stats = await this.reviewsService.getAverageRating(userId);
    return {
      reviews,
      ...stats,
    };
  }
}
