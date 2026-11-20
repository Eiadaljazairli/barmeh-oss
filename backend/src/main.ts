import './instrumentation';

import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import compression from 'compression';
import helmet from 'helmet';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { Logger as PinoLogger } from 'nestjs-pino';
import { execSync } from 'child_process';
import { SanitizePipe } from './common/pipes/sanitize.pipe';
import { HttpAdapterHost } from '@nestjs/core';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  let gitSha = 'unknown';
  try {
    gitSha =
      process.env.GIT_COMMIT_SHA ||
      process.env.VERCEL_GIT_COMMIT_SHA ||
      execSync('git rev-parse --short HEAD').toString().trim() ||
      process.env.npm_package_version ||
      'unknown';
  } catch (_e) {
    gitSha = process.env.npm_package_version || 'unknown';
  }

  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: `barmeh-api@${gitSha}`,
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    beforeSend(event) {
      if (event.request && event.request.headers) {
        const requestId = event.request.headers['x-request-id'];
        if (requestId) {
          event.tags = { ...event.tags, requestId };
        }
      }
      return event;
    },
  });

  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });

  app
    .getHttpAdapter()
    .getInstance()
    .on('request', (_req: any, res: any) => {
      res.setMaxListeners(20);
    });

  app.useLogger(app.get(PinoLogger));

  app.use(
    helmet({
      contentSecurityPolicy:
        process.env.NODE_ENV === 'production' ? undefined : false,
    }),
  );

  const corsOrigins = process.env.CORS_ORIGINS;
  app.enableCors({
    origin:
      process.env.NODE_ENV === 'production'
        ? corsOrigins
          ? corsOrigins.split(',').map((o) => o.trim())
          : []
        : true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(compression());

  app.useGlobalFilters(
    new AllExceptionsFilter(app.get(HttpAdapterHost), app.get(ConfigService)),
  );

  app.enableShutdownHooks();

  app.setGlobalPrefix('v1', {
    exclude: ['listing/:id', 'metrics'],
  });

  app.useGlobalPipes(
    new SanitizePipe(),
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  if (process.env.NODE_ENV !== 'production') {
    app.getHttpAdapter().get('/v1/__test/trigger-error', () => {
      throw new Error('Observability Test Error - Sentry should catch this');
    });
  }

  if (process.env.NODE_ENV !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Barmeh API')
      .setDescription(
        'Official documentation for the Barmeh Marketplace Backend.',
      )
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('Auth', 'Authentication and Authorization')
      .addTag('Listings', 'Marketplace Listings')
      .addTag('Users', 'User Profiles and Management')
      .addTag('Categories', 'Product Categories')
      .addTag('Health', 'System Health and Monitoring')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');

  const logger = new Logger('Bootstrap');
  logger.log(`Backend is running on: http://0.0.0.0:${port}`);
  logger.log(`Release: barmeh-api@${gitSha}`);
}

void bootstrap();
