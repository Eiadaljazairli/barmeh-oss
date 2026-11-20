import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async createReview(
    reviewerId: string,
    dto: { reviewedUserId: string; rating: number; comment?: string },
  ) {
    if (reviewerId === dto.reviewedUserId) {
      throw new BadRequestException('You cannot review yourself');
    }

    if (dto.rating < 1 || dto.rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const chat = await this.prisma.chat.findFirst({
      where: {
        OR: [
          { userAId: reviewerId, userBId: dto.reviewedUserId },
          { userAId: dto.reviewedUserId, userBId: reviewerId },
        ],
      },
    });

    if (!chat) {
      throw new ForbiddenException(
        'You can only review users you have chatted with',
      );
    }

    const review = await this.prisma.review.upsert({
      where: {
        reviewerId_reviewedUserId: {
          reviewerId,
          reviewedUserId: dto.reviewedUserId,
        },
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
      create: {
        reviewerId,
        reviewedUserId: dto.reviewedUserId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    await this.updateUserTrustScore(dto.reviewedUserId);

    return review;
  }

  async getUserReviews(userId: string) {
    return this.prisma.review.findMany({
      where: { reviewedUserId: userId },
      include: {
        reviewer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAverageRating(userId: string) {
    const aggregate = await this.prisma.review.aggregate({
      where: { reviewedUserId: userId },
      _avg: { rating: true },
      _count: { rating: true },
    });

    return {
      average: aggregate._avg.rating || 0,
      count: aggregate._count.rating || 0,
    };
  }

  private async updateUserTrustScore(userId: string) {
    const { average } = await this.getAverageRating(userId);
    await this.prisma.user.update({
      where: { id: userId },
      data: { trustScore: average },
    });
  }
}
