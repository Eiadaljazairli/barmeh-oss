import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { type Job } from 'bull';
import { NotificationsService } from './notifications.service';
import { NotificationType } from '@prisma/client';

@Processor('notifications')
export class NotificationsProcessor {
  private readonly logger = new Logger(NotificationsProcessor.name);

  constructor(private readonly notificationsService: NotificationsService) {}

  @Process('send-push')
  async handleSendPush(
    job: Job<{
      userId: string;
      title: string;
      body: string;
      type: NotificationType;
      referenceId?: string;
    }>,
  ) {
    try {
      this.logger.debug(`Sending push notification to user ${job.data.userId}`);
      await this.notificationsService.sendPushNotification(
        job.data.userId,
        job.data.title,
        job.data.body,
        job.data.type,
        job.data.referenceId,
      );
      return { success: true };
    } catch (error) {
      this.logger.error(`Failed to send push to ${job.data.userId}: ${error}`);
      throw error;
    }
  }
}
