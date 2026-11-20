import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: {
          level:
            configService.get('NODE_ENV') === 'production' ? 'info' : 'debug',
          transport:
            configService.get('NODE_ENV') !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true } }
              : undefined,
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'req.body.password',
              'req.body.passwordHash',
              'req.body.oldPassword',
              'req.body.newPassword',
              'req.body.token',
              'req.body.refreshToken',
              'req.body.accessToken',
              'req.body.refresh_token',
              'req.body.access_token',
              'req.body.jwt',
              'req.body.secret',
              'req.body.apiKey',
              'req.body.otp',
              'req.body.otpCode',
              'req.body.code',
              '*.password',
              '*.token',
              '*.secret',
              '*.jwt',
              '*.apiKey',
            ],
            remove: true,
          },
          customProps: (req: any) => ({
            requestId: req.headers['x-request-id'],
            userId: req.user?.id,
          }),
        },
      }),
    }),
  ],
})
export class AppLoggerModule {}
