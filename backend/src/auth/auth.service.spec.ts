import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailService } from '../mail/mail.service';
import { TelegramService } from '../telegram/telegram.service';
import { AIService } from '../ai/ai.service';
import { ChatGateway } from '../chat/chat.gateway';
import { SessionsService } from './sessions.service';
import { AnalyticsService } from '../common/analytics/analytics.service';
import { UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as argon2 from 'argon2';

process.env.GOOGLE_CLIENT_ID_WEB = 'test-web.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_ID_ANDROID = 'test-android.apps.googleusercontent.com';
process.env.GOOGLE_CLIENT_ID_IOS = 'test-ios.apps.googleusercontent.com';

jest.mock('argon2');

describe('AuthService (Email/Password & OTP)', () => {
  let service: AuthService;
  let prisma: any;
  let redisClient: any;
  let jwtService: any;
  let aiService: any;

  beforeEach(async () => {
    redisClient = {
      get: jest.fn().mockResolvedValue(null),
      set: jest.fn().mockResolvedValue('OK'),
      del: jest.fn().mockResolvedValue(1),
      incr: jest.fn().mockResolvedValue(1),
      expire: jest.fn().mockResolvedValue(1),
      ttl: jest.fn().mockResolvedValue(-2),
    };

    prisma = {
      user: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        upsert: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      $transaction: jest.fn().mockImplementation(async (cb) => cb(prisma)),
    };

    jwtService = {
      signAsync: jest.fn().mockResolvedValue('signed-jwt-token'),
      verify: jest.fn(),
    };

    aiService = {
      moderateText: jest.fn().mockResolvedValue({ isSafe: true }),
      analyzeListing: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: RedisService, useValue: { client: redisClient } },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: { get: jest.fn() } },
        { provide: MailService, useValue: { sendOtp: jest.fn() } },
        { provide: TelegramService, useValue: { sendMessage: jest.fn() } },
        { provide: AIService, useValue: aiService },
        { provide: ChatGateway, useValue: { emitToAdmins: jest.fn() } },
        {
          provide: SessionsService,
          useValue: {
            createSession: jest.fn().mockResolvedValue(undefined),
            clearSession: jest.fn().mockResolvedValue(undefined),
            terminateSession: jest.fn().mockResolvedValue(undefined),
            terminateAllOtherSessions: jest.fn().mockResolvedValue(undefined),
          },
        },
        {
          provide: AnalyticsService,
          useValue: {
            trackLogin: jest.fn(),
            trackSignup: jest.fn(),
            captureEvent: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('requestEmailOtp', () => {
    it('should send OTP to email', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await service.requestEmailOtp({
        email: 'test@example.com',
        isLogin: false,
      });

      expect(result.message).toContain('بريدك');
      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe('verifyOtp', () => {
    it('should verify OTP and return tokens for existing user', async () => {
      redisClient.get.mockResolvedValue('123456');
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        isBlocked: false,
        isAdmin: false,
      });
      prisma.user.upsert.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        isBlocked: false,
        isAdmin: false,
      });

      const result = (await service.verifyOtp({
        email: 'test@example.com',
        otp: '123456',
      })) as any;

      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.user.id).toBe('u1');
    });

    it('should throw UnauthorizedException for wrong OTP', async () => {
      redisClient.get.mockResolvedValue('111111');
      await expect(
        service.verifyOtp({ email: 'test@example.com', otp: '999999' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('should throw BadRequestException when email is missing', async () => {
      await expect(service.verifyOtp({ otp: '123456' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should log warning and continue if AI rejects name', async () => {
      redisClient.get.mockResolvedValue('123456');
      aiService.moderateText.mockResolvedValue({
        isSafe: false,
        reason: 'Bad word',
      });
      prisma.user.findUnique.mockResolvedValue(null);
      prisma.user.upsert.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        isBlocked: false,
        isAdmin: false,
      });

      const result = await service.verifyOtp({
        email: 'test@example.com',
        otp: '123456',
        firstName: 'Bad',
        lastName: 'Name',
      });

      expect(result).toBeDefined();
    });
  });

  describe('passwordLogin', () => {
    it('should login with correct password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        password: 'hashed-password',
        isAdmin: false,
      });
      (argon2.verify as jest.Mock).mockResolvedValue(true);

      const result = (await service.passwordLogin(
        'test@example.com',
        'password123',
      )) as any;

      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.user.id).toBe('u1');
    });

    it('should throw UnauthorizedException for wrong password', async () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'u1',
        email: 'test@example.com',
        password: 'hashed-password',
      });
      (argon2.verify as jest.Mock).mockResolvedValue(false);

      await expect(
        service.passwordLogin('test@example.com', 'wrong-pass'),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('googleLogin', () => {
    const WEB_CLIENT_ID =
      'test-web.apps.googleusercontent.com';
    const ANDROID_CLIENT_ID =
      'test-android.apps.googleusercontent.com';
    const IOS_CLIENT_ID =
      'test-ios.apps.googleusercontent.com';

    const mockVerify = (payload: Record<string, unknown> | null) => {
      const verifyIdToken = jest
        .fn()
        .mockResolvedValue({ getPayload: () => payload });
      (service as any).googleClient.verifyIdToken = verifyIdToken;
      return verifyIdToken;
    };

    it('accepts the app’s web/android/ios client IDs as token audiences', () => {
      const audiences: string[] = (service as any).googleAudiences;
      expect(audiences).toEqual(
        expect.arrayContaining([
          WEB_CLIENT_ID,
          ANDROID_CLIENT_ID,
          IOS_CLIENT_ID,
        ]),
      );
    });

    it('verifies the ID token against the full audience list', async () => {
      const verifyIdToken = mockVerify({
        email: 'g@example.com',
        sub: 'google-123',
        name: 'Test User',
      });
      prisma.user.findFirst.mockResolvedValue(null);
      prisma.user.create.mockResolvedValue({
        id: 'gu1',
        email: 'g@example.com',
        googleId: 'google-123',
        firstName: 'Test',
        lastName: 'User',
        username: 'user_abcd1234',
        isAdmin: false,
      });

      const result = (await service.googleLogin({
        idToken: 'valid-token',
      })) as any;

      expect(verifyIdToken).toHaveBeenCalledWith(
        expect.objectContaining({
          idToken: 'valid-token',
          audience: (service as any).googleAudiences,
        }),
      );
      expect(result.accessToken).toBe('signed-jwt-token');
      expect(result.isNewUser).toBe(true);
      expect(result.user.email).toBe('g@example.com');
    });

    it('links googleId to an existing email-only account', async () => {
      mockVerify({
        email: 'exists@example.com',
        sub: 'google-999',
        name: 'Ex Ists',
      });
      prisma.user.findFirst.mockResolvedValue({
        id: 'u2',
        email: 'exists@example.com',
        googleId: null,
        isAdmin: false,
      });
      prisma.user.update.mockResolvedValue({
        id: 'u2',
        email: 'exists@example.com',
        googleId: 'google-999',
        isAdmin: false,
      });

      const result = (await service.googleLogin({
        idToken: 'valid-token',
      })) as any;

      expect(prisma.user.update).toHaveBeenCalled();
      expect(result.isNewUser).toBe(false);
      expect(result.accessToken).toBe('signed-jwt-token');
    });

    it('throws UnauthorizedException when token verification fails', async () => {
      (service as any).googleClient.verifyIdToken = jest
        .fn()
        .mockRejectedValue(
          new Error('Wrong recipient, payload audience != requiredAudience'),
        );

      await expect(
        service.googleLogin({ idToken: 'bad-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('throws UnauthorizedException when the token payload has no email', async () => {
      mockVerify({ sub: 'google-000' });

      await expect(
        service.googleLogin({ idToken: 'no-email-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
