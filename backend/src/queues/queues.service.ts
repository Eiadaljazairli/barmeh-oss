import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('search-indexing') private searchIndexingQueue: Queue,
    @InjectQueue('notifications') private notificationsQueue: Queue,
    @InjectQueue('image-processing') private imageProcessingQueue: Queue,
    @InjectQueue('cleanup') private cleanupQueue: Queue,
  ) {}

  async indexListing(listingId: string, delay = 0) {
    return this.searchIndexingQueue.add(
      'index-listing',
      { listingId },
      { delay },
    );
  }

  async deleteFromIndex(listingId: string) {
    return this.searchIndexingQueue.add('delete-from-index', { listingId });
  }

  async reindexAll() {
    return this.searchIndexingQueue.add('reindex-all', {});
  }

  async sendTelegram(chatId: string, message: string) {
    return this.notificationsQueue.add('send-telegram', { chatId, message });
  }

  async sendEmail(
    to: string,
    subject: string,
    body: string,
    templateId?: string,
    templateData?: Record<string, any>,
  ) {
    return this.notificationsQueue.add('send-email', {
      to,
      subject,
      body,
      templateId,
      templateData,
    });
  }

  async sendPush(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, string>,
  ) {
    return this.notificationsQueue.add('send-push', {
      userId,
      title,
      body,
      data,
    });
  }

  async notifyNewListing(
    listingId: string,
    userId: string,
    recipientEmails: string[],
  ) {
    return this.notificationsQueue.add('new-listing-notification', {
      listingId,
      userId,
      recipientEmails,
    });
  }

  async purgeSoftDeletedListings() {
    return this.cleanupQueue.add('purge-soft-deleted-listings', {});
  }

  async purgeSoftDeletedMessages() {
    return this.cleanupQueue.add('purge-soft-deleted-messages', {});
  }

  async archiveAuditLogs() {
    return this.cleanupQueue.add('archive-audit-logs', {});
  }

  async cleanupExpiredData() {
    return this.cleanupQueue.add('cleanup-expired-data', {});
  }

  async resizeImage(imageId: string, sizes: number[]) {
    return this.imageProcessingQueue.add('resize-image', { imageId, sizes });
  }

  async optimizeImage(imageId: string) {
    return this.imageProcessingQueue.add('optimize-image', { imageId });
  }

  async generateThumbnail(imageId: string) {
    return this.imageProcessingQueue.add('generate-thumbnail', { imageId });
  }

  async getQueueCounts() {
    return {
      searchIndexing: {
        waiting: await this.searchIndexingQueue.getWaitingCount(),
        active: await this.searchIndexingQueue.getActiveCount(),
        failed: await this.searchIndexingQueue.getFailedCount(),
      },
      notifications: {
        waiting: await this.notificationsQueue.getWaitingCount(),
        active: await this.notificationsQueue.getActiveCount(),
        failed: await this.notificationsQueue.getFailedCount(),
      },
      cleanup: {
        waiting: await this.cleanupQueue.getWaitingCount(),
        active: await this.cleanupQueue.getActiveCount(),
        failed: await this.cleanupQueue.getFailedCount(),
      },
    };
  }
}
