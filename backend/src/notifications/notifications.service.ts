import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import { Expo, ExpoPushMessage } from 'expo-server-sdk';
import { InjectQueue } from '@nestjs/bull';
import { type Queue } from 'bull';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private expo = new Expo();

  constructor(
    private prisma: PrismaService,
    @InjectQueue('notifications') private notificationsQueue: Queue,
  ) {}

  async create(data: {
    userId: string;
    title: string;
    body: string;
    type: NotificationType;
    referenceId?: string;
  }) {
    const notification = await this.prisma.notification.create({
      data,
    });

    await this.notificationsQueue
      .add('send-push', {
        userId: data.userId,
        title: data.title,
        body: data.body,
        type: data.type,
        referenceId: data.referenceId,
      })
      .catch((err) => {
        this.logger.error(`Failed to queue push notification: ${err.message}`);
      });

    return notification;
  }

  async sendPushNotification(
    userId: string,
    title: string,
    body: string,
    type: NotificationType,
    referenceId?: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { notificationPreferences: true },
    });

    if (!user || !user.expoPushToken) return;

    if (user.notificationPreferences) {
      const prefs = user.notificationPreferences;
      if (type === NotificationType.MESSAGE && !prefs.messages) return;
      if (type === NotificationType.LISTING_UPDATE && !prefs.newListings)
        return;
      if (type === NotificationType.PROMO && !prefs.newListings) return;
      if (type === NotificationType.SYSTEM && !prefs.system) return;
    }

    if (!Expo.isExpoPushToken(user.expoPushToken)) {
      this.logger.warn(`Invalid Expo push token for user ${userId}`);
      return;
    }

    const message: ExpoPushMessage = {
      to: user.expoPushToken,
      sound: 'default',
      title,
      body,
      data: { type, referenceId },
      priority: 'high',
    };

    try {
      const chunks = this.expo.chunkPushNotifications([message]);
      for (const chunk of chunks) {
        await this.expo.sendPushNotificationsAsync(chunk);
      }
      this.logger.log(`Push notification sent to user ${userId}`);
    } catch (error) {
      this.logger.error(`Error calling Expo Push API: ${error}`);
    }
  }

  async findAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async markAsRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteOne(id: string, userId: string) {
    return this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async deleteAll(userId: string) {
    return this.prisma.notification.deleteMany({
      where: { userId },
    });
  }

  async broadcast(data: {
    title: string;
    body: string;
    target: 'all' | 'merchants' | 'consumers';
  }) {
    const where: any = { isBlocked: false, isDeleted: false };
    if (data.target === 'merchants') where.userType = 'MERCHANT';
    if (data.target === 'consumers') where.userType = 'CONSUMER';

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true, expoPushToken: true, notificationPreferences: true },
    });

    await this.prisma.notification.createMany({
      data: users.map((u) => ({
        userId: u.id,
        title: data.title,
        body: data.body,
        type: NotificationType.SYSTEM,
      })),
    });

    const messages: ExpoPushMessage[] = users
      .filter((u) => u.expoPushToken && Expo.isExpoPushToken(u.expoPushToken))
      .map((u) => ({
        to: u.expoPushToken!,
        sound: 'default',
        title: data.title,
        body: data.body,
        data: { type: NotificationType.SYSTEM },
        priority: 'high',
      }));

    let pushSent = 0;
    let pushFailed = 0;
    const chunks = this.expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      try {
        const tickets = await this.expo.sendPushNotificationsAsync(chunk);
        for (const t of tickets) {
          if (t.status === 'ok') pushSent++;
          else pushFailed++;
        }
      } catch (error) {
        this.logger.error(`Broadcast chunk failed: ${error}`);
        pushFailed += chunk.length;
      }
    }

    return {
      totalUsers: users.length,
      withPushToken: messages.length,
      pushSent,
      pushFailed,
    };
  }
}
