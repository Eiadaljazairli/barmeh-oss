import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as Sentry from '@sentry/nestjs';
import { Logger } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly configService: ConfigService,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const response =
      exception instanceof HttpException ? exception.getResponse() : null;
    const message =
      response && typeof response === 'object' && (response as any).message
        ? (response as any).message
        : (exception as any).message || 'Unknown error';

    const responseBody = {
      statusCode: httpStatus,
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(ctx.getRequest()),
      message:
        this.configService.get('NODE_ENV') === 'production' &&
        httpStatus === 500
          ? 'An internal server error occurred'
          : message,
    };

    this.logger.error(
      `Exception: ${JSON.stringify(responseBody)}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    if (httpStatus >= 500) {
      Sentry.captureException(exception);
    }

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }
}
