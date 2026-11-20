import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TerminusModule } from '@nestjs/terminus';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { HealthController } from './health.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    TerminusModule,
    PrismaModule,
    RedisModule,
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        node:
          configService.get('ELASTICSEARCH_NODE') || 'http://localhost:9200',
        requestTimeout: 3000,
      }),
    }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
