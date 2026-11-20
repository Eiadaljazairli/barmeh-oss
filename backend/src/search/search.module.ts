import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { SearchService } from './search.service';

import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    ElasticsearchModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        node:
          config.get<string>('ELASTICSEARCH_NODE') || 'http://localhost:9200',
        auth: {
          username: config.get<string>('ELASTICSEARCH_USERNAME') || 'elastic',
          password:
            config.get<string>('ELASTICSEARCH_PASSWORD') || 'changeme',
        },
        requestTimeout: 1000,
        maxRetries: 0,
      }),
    }),
  ],
  providers: [SearchService],
  exports: [SearchService],
})
export class SearchModule {}
