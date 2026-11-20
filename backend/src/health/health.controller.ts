import {
  Controller,
  Get,
  Logger,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AdminGuard } from '../auth/admin.guard';
import {
  HealthCheckService,
  HealthCheck,
  PrismaHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);
  private startTime = Date.now();

  constructor(
    private health: HealthCheckService,
    private prismaHealth: PrismaHealthIndicator,
    private prisma: PrismaService,
    private redis: RedisService,
    private es: ElasticsearchService,
  ) {}

  @Get()
  @HealthCheck()
  checkLiveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('live')
  @HealthCheck()
  checkLive() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  @HealthCheck()
  async checkReadiness() {
    const results = await Promise.allSettled([
      this.prismaHealth.pingCheck('database', this.prisma),
      this.checkRedis(),
      this.checkElasticsearch(),
    ]);

    const database = results[0].status === 'fulfilled' ? 'up' : 'down';
    const redis = results[1].status === 'fulfilled' ? 'up' : 'down';
    const es = results[2].status === 'fulfilled' ? 'up' : 'down';

    if (database === 'down' || redis === 'down') {
      throw new ServiceUnavailableException({
        status: 'error',
        services: { database, redis, es },
      });
    }

    const status = es === 'down' ? 'degraded' : 'ok';

    return {
      status,
      services: { database, redis, es },
      timestamp: new Date().toISOString(),
    };
  }

  @Get('deep')
  @UseGuards(JwtAuthGuard, AdminGuard)
  @HealthCheck()
  async checkDeep() {
    const mem = process.memoryUsage();
    const memMB = {
      heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
      heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      rss: Math.round(mem.rss / 1024 / 1024),
    };

    const results = await Promise.allSettled([
      this.prismaHealth.pingCheck('database', this.prisma),
      this.checkRedis(),
      this.checkElasticsearch(),
    ]);

    const database = results[0].status === 'fulfilled' ? 'up' : 'down';
    const redis = results[1].status === 'fulfilled' ? 'up' : 'down';
    const es = results[2].status === 'fulfilled' ? 'up' : 'down';

    const redisInfo: Record<string, any> = {};
    if (redis === 'up') {
      try {
        const info = await this.redis.client.info();
        const lines = info.split('\n');
        for (const line of lines) {
          if (line.includes(':')) {
            const [key, value] = line.split(':');
            redisInfo[key.trim()] = value.trim();
          }
        }
      } catch (e) {
        this.logger.debug(`Failed to get Redis info: ${e}`);
      }
    }

    const status =
      database === 'down' || redis === 'down'
        ? 'error'
        : es === 'down'
          ? 'degraded'
          : 'ok';

    return {
      status,
      timestamp: new Date().toISOString(),
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      memory: memMB,
      services: { database, redis, es },
      redis: redisInfo.redis_version
        ? {
            version: redisInfo.redis_version,
            usedMemory: redisInfo.used_memory_human,
            connectedClients: redisInfo.connected_clients,
            uptime: redisInfo.uptime_in_seconds,
          }
        : undefined,
    };
  }

  private async checkRedis() {
    try {
      const pong = await this.redis.client.ping();
      if (pong !== 'PONG') throw new Error('Redis ping failed');
      return { redis: { status: 'up' } };
    } catch {
      throw new Error('Redis down');
    }
  }

  private async checkElasticsearch() {
    try {
      await this.es.ping();
      return { elasticsearch: { status: 'up' } };
    } catch {
      throw new Error('Elasticsearch down');
    }
  }
}
