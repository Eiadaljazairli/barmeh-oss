import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { type Job } from 'bull';
import { PrismaService } from '../../prisma/prisma.service';

@Processor('cleanup')
export class CleanupProcessor {
  private readonly logger = new Logger(CleanupProcessor.name);
  private readonly SOFT_DELETE_RETENTION_DAYS = 90;

  constructor(private readonly prisma: PrismaService) {}

  @Process('purge-soft-deleted-listings')
  async handlePurgeSoftDeletedListings(_job: Job) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - this.SOFT_DELETE_RETENTION_DAYS,
      );

      this.logger.log(
        `Purging listings soft-deleted before ${cutoffDate.toISOString()}`,
      );

      const result = await this.prisma.listing.deleteMany({
        where: {
          deletedAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Purged ${result.count} listings`);
      return { success: true, purgedCount: result.count };
    } catch (error) {
      this.logger.error(`Failed to purge soft-deleted listings: ${error}`);
      throw error;
    }
  }

  @Process('purge-soft-deleted-messages')
  async handlePurgeSoftDeletedMessages(_job: Job) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(
        cutoffDate.getDate() - this.SOFT_DELETE_RETENTION_DAYS,
      );

      this.logger.log(
        `Purging messages soft-deleted before ${cutoffDate.toISOString()}`,
      );

      const result = await this.prisma.message.deleteMany({
        where: {
          deletedAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Purged ${result.count} messages`);
      return { success: true, purgedCount: result.count };
    } catch (error) {
      this.logger.error(`Failed to purge soft-deleted messages: ${error}`);
      throw error;
    }
  }

  @Process('archive-audit-logs')
  async handleArchiveAuditLogs(_job: Job) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setFullYear(cutoffDate.getFullYear() - 1);

      this.logger.log(
        `Archiving audit logs before ${cutoffDate.toISOString()}`,
      );

      const result = await this.prisma.auditLog.deleteMany({
        where: {
          createdAt: {
            lt: cutoffDate,
          },
        },
      });

      this.logger.log(`Archived ${result.count} audit logs`);
      return { success: true, archivedCount: result.count };
    } catch (error) {
      this.logger.error(`Failed to archive audit logs: ${error}`);
      throw error;
    }
  }

  @Process('cleanup-expired-data')
  async handleCleanupExpiredData(_job: Job) {
    try {
      this.logger.log('Cleaning up expired data...');
      const now = new Date();

      const expiredPromotions = await this.prisma.activePromotion.deleteMany({
        where: {
          expiresAt: { lt: now },
        },
      });

      this.logger.log(`Removed ${expiredPromotions.count} expired promotions`);
      return { success: true, expiredPromotions: expiredPromotions.count };
    } catch (error) {
      this.logger.error(`Failed to cleanup expired data: ${error}`);
      throw error;
    }
  }
}
