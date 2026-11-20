import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';

@Injectable()
export class AnalyticsService implements OnModuleDestroy {
  private readonly logger = new Logger(AnalyticsService.name);
  private client: PostHog | null = null;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('POSTHOG_API_KEY');
    const host = this.configService.get<string>('POSTHOG_HOST');

    if (apiKey) {
      this.client = new PostHog(apiKey, {
        host: host || 'https://us.i.posthog.com',
      });
      this.logger.log('PostHog initialized');
    } else {
      this.logger.warn('POSTHOG_API_KEY not set — analytics disabled');
    }
  }

  captureEvent(
    distinctId: string,
    event: string,
    properties?: Record<string, any>,
  ) {
    if (!this.client) return;
    this.client.capture({
      distinctId,
      event,
      properties: {
        ...properties,
        environment: this.configService.get('NODE_ENV'),
      },
    });
  }

  identifyUser(distinctId: string, traits?: Record<string, any>) {
    if (!this.client) return;
    this.client.identify({
      distinctId,
      properties: traits,
    });
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.shutdown();
    }
  }
}
