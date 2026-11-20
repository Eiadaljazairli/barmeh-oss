import { Module } from '@nestjs/common';
import { ListingsService } from './listings.service';
import { ListingsController } from './listings.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { AbuseModule } from '../abuse/abuse.module';
import { RedisModule } from '../redis/redis.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ModerationModule } from '../moderation/moderation.module';
import { ShareController } from './share.controller';

@Module({
  imports: [
    PrismaModule,
    SearchModule,
    AbuseModule,
    RedisModule,
    NotificationsModule,
    ModerationModule,
  ],
  controllers: [ListingsController, ShareController],
  providers: [ListingsService],
  exports: [ListingsService],
})
export class ListingsModule {}
