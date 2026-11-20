import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config';
import { SearchModule } from '../search/search.module';
import { ImagesModule } from '../images/images.module';
import { QueuesService } from './queues.service';
import {
  SearchIndexingProcessor,
  ImageProcessingProcessor,
  CleanupProcessor,
} from './processors';

@Module({
  imports: [
    SearchModule,
    ImagesModule,
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: configService.get('REDIS_HOST') || '127.0.0.1',
          port: configService.get('REDIS_PORT')
            ? parseInt(configService.get('REDIS_PORT')!)
            : 6379,
          password: configService.get('REDIS_PASSWORD'),
          retryStrategy: (times: number) => Math.min(times * 50, 2000),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: {
            age: 3600,
          },
          removeOnFail: {
            age: 86400,
          },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'search-indexing' },
      { name: 'notifications' },
      { name: 'image-processing' },
      { name: 'cleanup' },
    ),
  ],
  providers: [
    QueuesService,
    SearchIndexingProcessor,
    ImageProcessingProcessor,
    CleanupProcessor,
  ],
  exports: [QueuesService, BullModule],
})
export class QueuesModule {}
