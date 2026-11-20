import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import Redis from 'ioredis';

export interface RedisLike {
  get(key: string): Promise<string | null>;
  set(
    key: string,
    value: string,
    mode?: string,
    ttl?: number,
  ): Promise<'OK' | null>;
  del(key: string): Promise<number>;
  incr(key: string): Promise<number>;
  expire(key: string, seconds: number): Promise<number>;
  ttl(key: string): Promise<number>;
  ping(): Promise<string>;
  info(): Promise<string>;
  quit(): Promise<unknown>;
}

class MemoryStore implements RedisLike {
  private store = new Map<string, { value: string; expiresAt?: number }>();

  private cleanup(key: string): string | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value;
  }

  get(key: string): Promise<string | null> {
    return Promise.resolve(this.cleanup(key));
  }

  set(key: string, value: string, mode?: string, ttl?: number): Promise<'OK'> {
    const expiresAt =
      mode === 'EX' && ttl ? Date.now() + ttl * 1000 : undefined;
    this.store.set(key, { value, expiresAt });
    return Promise.resolve('OK');
  }

  del(key: string): Promise<number> {
    return Promise.resolve(this.store.delete(key) ? 1 : 0);
  }

  incr(key: string): Promise<number> {
    const cur = this.cleanup(key);
    const next = (parseInt(cur || '0', 10) + 1).toString();
    const entry = this.store.get(key);
    this.store.set(key, { value: next, expiresAt: entry?.expiresAt });
    return Promise.resolve(parseInt(next, 10));
  }

  expire(key: string, seconds: number): Promise<number> {
    const entry = this.store.get(key);
    if (!entry) return Promise.resolve(0);
    entry.expiresAt = Date.now() + seconds * 1000;
    return Promise.resolve(1);
  }

  ttl(key: string): Promise<number> {
    const entry = this.store.get(key);
    if (!entry || !entry.expiresAt) return Promise.resolve(-1);
    const remaining = Math.ceil((entry.expiresAt - Date.now()) / 1000);
    return Promise.resolve(remaining > 0 ? remaining : -2);
  }

  ping(): Promise<string> {
    return Promise.resolve('PONG');
  }
  info(): Promise<string> {
    return Promise.resolve(
      'redis_version:7.0.0\nused_memory_human:0B\nconnected_clients:0\nuptime_in_seconds:0',
    );
  }
  quit(): Promise<unknown> {
    this.store.clear();
    return Promise.resolve('OK');
  }
}

import { ConfigService } from '@nestjs/config';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);

  constructor(private configService: ConfigService) {}

  public client!: RedisLike;
  public pubClient!: RedisLike;
  public subClient!: RedisLike;
  public isMemoryMode = false;

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST') ?? 'localhost';
    const port = parseInt(
      this.configService.get<string>('REDIS_PORT') ?? '6379',
      10,
    );
    const password =
      this.configService.get<string>('REDIS_PASSWORD') || undefined;

    const opts: any = {
      host,
      port,
      password,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      enableReadyCheck: true,
      retryStrategy: (times: number) => {
        if (times > 3) {
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      reconnectOnError: (err: Error) => {
        const targetErrors = ['READONLY', 'ETIMEDOUT'];
        return targetErrors.some((e) => err.message.includes(e));
      },
    };

    try {
      const testClient = new Redis(opts);
      await testClient.connect();
      await testClient.ping();
      await testClient.quit();

      const clientReal = new Redis(opts);
      const pubReal = new Redis(opts);
      const subReal = new Redis(opts);

      await Promise.all([
        clientReal.connect(),
        pubReal.connect(),
        subReal.connect(),
      ]);

      clientReal.on('error', (e: Error) =>
        this.logger.error(`Redis client error: ${e.message}`),
      );
      pubReal.on('error', (e: Error) =>
        this.logger.error(`Redis pub error: ${e.message}`),
      );
      subReal.on('error', (e: Error) =>
        this.logger.error(`Redis sub error: ${e.message}`),
      );

      this.client = clientReal as unknown as RedisLike;
      this.pubClient = pubReal as unknown as RedisLike;
      this.subClient = subReal as unknown as RedisLike;

      this.logger.log(`✅ Connected to Redis at ${host}:${port}`);
    } catch (e: any) {
      this.isMemoryMode = true;
      this.client = new MemoryStore();
      this.pubClient = new MemoryStore();
      this.subClient = new MemoryStore();
      this.logger.warn(
        `⚠️ Redis unavailable (${e.message}) — using in-memory store (dev mode).`,
      );
    }
  }

  async onModuleDestroy() {
    await Promise.allSettled([
      this.client?.quit(),
      this.pubClient?.quit(),
      this.subClient?.quit(),
    ]);
  }
}
