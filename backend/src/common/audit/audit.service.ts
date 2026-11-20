import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export interface AuditLogData {
  entityType: string;
  entityId: string;
  action: string;
  actor: string;
  changes?: Record<string, any>;
  reason?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly prisma: PrismaService) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.prisma.auditLog.create({
        data: {
          entityType: data.entityType,
          entityId: data.entityId,
          action: data.action,
          actor: data.actor,
          changes: data.changes || {},
          reason: data.reason,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to write audit log: ${error}`);
    }
  }

  async getEntityLogs(entityType: string, entityId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getActorLogs(actor: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { actor },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getActionLogs(action: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { action },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }
}
