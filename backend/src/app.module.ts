import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CacheModule } from '@nestjs/cache-manager';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { RedisModule } from './redis/redis.module';
import { ListingsModule } from './listings/listings.module';
import { AuthModule } from './auth/auth.module';
import { ChatModule } from './chat/chat.module';
import { AbuseModule } from './abuse/abuse.module';
import { SearchModule } from './search/search.module';
import { MerchantModule } from './merchant/merchant.module';
import { ImagesModule } from './images/images.module';
import { HealthModule } from './health/health.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { CategoriesModule } from './categories/categories.module';
import { UsersModule } from './users/users.module';
import { ReportsModule } from './reports/reports.module';
import { TelegramModule } from './telegram/telegram.module';
import { MailModule } from './mail/mail.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AIModule } from './ai/ai.module';
import { ModerationModule } from './moderation/moderation.module';
import { ConfigModule } from '@nestjs/config';
import { AppLoggerModule } from './common/logger/logger.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { CacheInvalidationListener } from './common/cache/cache-invalidation.listener';

import { NestModule, MiddlewareConsumer, RequestMethod } from '@nestjs/common';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { ReviewsModule } from './reviews/reviews.module';
import { SavedSearchesModule } from './saved-searches/saved-searches.module';
import { QueuesModule } from './queues/queues.module';
import { EncryptionModule } from './common/encryption/encryption.module';
import { AuditModule } from './common/audit/audit.module';
import { AnalyticsModule } from './common/analytics/analytics.module';
import { AppVersionModule } from './app-version/app-version.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import * as Joi from 'joi';

@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        DATABASE_URL: Joi.string().required(),
        JWT_SECRET: Joi.string().min(32).required(),
        ENCRYPTION_KEY: Joi.string().min(32).required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        ELASTICSEARCH_NODE: Joi.string().uri().required(),
        SENTRY_DSN: Joi.string().uri().optional().allow(''),
        OTEL_EXPORTER_OTLP_ENDPOINT: Joi.string().uri().optional(),
        POSTHOG_API_KEY: Joi.string().optional(),
        POSTHOG_HOST: Joi.string().uri().optional(),
      }),
      validationOptions: {
        allowUnknown: true,
        abortEarly: false,
      },
    }),
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: () => ({
        ttl: 300000,
      }),
    }),
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
    AppLoggerModule,
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60_000,
        limit: 100,
      },
    ]),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads/',
    }),
    PrismaModule,
    RedisModule,
    AIModule,
    AbuseModule,
    ModerationModule,
    SearchModule,
    ImagesModule,
    ListingsModule,
    AuthModule,
    ChatModule,
    HealthModule,
    CategoriesModule,
    MerchantModule,
    UsersModule,
    ReportsModule,
    TelegramModule,
    MailModule,
    NotificationsModule,
    ReviewsModule,
    SavedSearchesModule,
    BullBoardModule.forRoot({
      route: '/admin/queues',
      adapter: ExpressAdapter,
    }),
    BullBoardModule.forFeature(
      { name: 'search-indexing', adapter: BullAdapter },
      { name: 'notifications', adapter: BullAdapter },
      { name: 'image-processing', adapter: BullAdapter },
      { name: 'cleanup', adapter: BullAdapter },
    ),
    QueuesModule,
    EncryptionModule,
    AuditModule,
    AnalyticsModule,
    AppVersionModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    CacheInvalidationListener,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
