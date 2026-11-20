import { Global, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { SessionsService } from './sessions.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { OptionalJwtAuthGuard } from './optional-jwt-auth.guard';
import { TelegramModule } from '../telegram/telegram.module';
import { ChatModule } from '../chat/chat.module';

@Global()
@Module({
  imports: [
    JwtModule.registerAsync({
      global: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '30d' },
      }),
    }),
    TelegramModule,
    ChatModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, SessionsService, JwtAuthGuard, OptionalJwtAuthGuard],
  exports: [AuthService, SessionsService, JwtAuthGuard, OptionalJwtAuthGuard],
})
export class AuthModule {}
