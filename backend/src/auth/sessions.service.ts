import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SessionsService {
  private readonly logger = new Logger(SessionsService.name);

  constructor(private prisma: PrismaService) {}

  async createSession(
    userId: string,
    jti: string,
    options?: {
      deviceId?: string;
      deviceName?: string;
      userAgent?: string;
      ip?: string;
      refreshTokenHash?: string;
    },
  ) {
    return this.prisma.loginSession.create({
      data: {
        userId,
        jti,
        deviceId: options?.deviceId,
        deviceName: options?.deviceName,
        userAgent: options?.userAgent,
        ip: options?.ip,
        refreshTokenHash: options?.refreshTokenHash,
      },
    });
  }

  async findActiveByJti(jti: string) {
    return this.prisma.loginSession.findFirst({
      where: { jti, revokedAt: null },
    });
  }

  async revoke(sessionId: string, reason?: string) {
    return this.prisma.loginSession.update({
      where: { id: sessionId },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  async revokeByJti(jti: string, reason?: string) {
    return this.prisma.loginSession.updateMany({
      where: { jti, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  async revokeAllForUser(userId: string, reason?: string) {
    return this.prisma.loginSession.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date(), revokeReason: reason },
    });
  }

  async findActiveSessionsForUser(userId: string) {
    return this.prisma.loginSession.findMany({
      where: { userId, revokedAt: null },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        deviceId: true,
        deviceName: true,
        userAgent: true,
        ip: true,
        country: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });
  }
}
