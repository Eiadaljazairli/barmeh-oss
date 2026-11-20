import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  UpgradeMerchantDto,
  UpdateMerchantProfileDto,
} from './dto/merchant.dto';
import { UserType } from '@prisma/client';

@Injectable()
export class MerchantService {
  constructor(private prisma: PrismaService) {}

  async upgradeToMerchant(userId: string, dto: UpgradeMerchantDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { merchantProfile: true },
    });

    if (!user) throw new NotFoundException('User not found');
    if (user.userType === UserType.MERCHANT) {
      throw new BadRequestException('User is already a merchant');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: { userType: UserType.MERCHANT },
      });

      return tx.merchantProfile.create({
        data: {
          userId,
          storeName: dto.storeName,
          storeAddress: dto.storeAddress,
          taxId: dto.taxId,
          businessHours: dto.businessHours || {},
          logoUrl: dto.logoUrl,
        },
      });
    });
  }

  async getProfile(userId: string) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            avatarUrl: true,
            trustScore: true,
          },
        },
      },
    });

    if (!profile) throw new NotFoundException('Merchant profile not found');
    return profile;
  }

  async updateProfile(userId: string, dto: UpdateMerchantProfileDto) {
    const profile = await this.prisma.merchantProfile.findUnique({
      where: { userId },
    });

    if (!profile) throw new NotFoundException('Merchant profile not found');

    return this.prisma.merchantProfile.update({
      where: { userId },
      data: {
        storeName: dto.storeName,
        storeAddress: dto.storeAddress,
        taxId: dto.taxId,
        businessHours: dto.businessHours,
        logoUrl: dto.logoUrl,
      },
    });
  }

  async getPendingVerifications() {
    return this.prisma.merchantProfile.findMany({
      where: { isVerified: false },
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async verifyMerchant(profileId: string) {
    return this.prisma.merchantProfile.update({
      where: { id: profileId },
      data: {
        isVerified: true,
        verifiedAt: new Date(),
      },
    });
  }
}
