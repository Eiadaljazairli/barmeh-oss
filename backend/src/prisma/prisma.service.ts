import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  async onModuleInit() {
    try {
      await this.$connect();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error(
        `❌ Failed to connect to Database (Prisma): ${msg}. App will not function correctly until DB is running.`,
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
