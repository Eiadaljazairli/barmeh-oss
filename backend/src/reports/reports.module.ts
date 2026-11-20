import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModerationModule } from '../moderation/moderation.module';

@Module({
  imports: [PrismaModule, ModerationModule],
  controllers: [ReportsController],
})
export class ReportsModule {}
