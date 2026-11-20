import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { RedisService } from '../src/redis/redis.service';
import { MailService } from '../src/mail/mail.service';
import { AIService } from '../src/ai/ai.service';
import { TelegramService } from '../src/telegram/telegram.service';
import { ChatGateway } from '../src/chat/chat.gateway';

jest.mock('expo-server-sdk', () => ({
  Expo: jest.fn().mockImplementation(() => ({
    sendPushNotificationsAsync: jest.fn().mockResolvedValue([]),
    chunkPushNotifications: jest.fn().mockReturnValue([]),
  })),
}));

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  const mockMailService = { sendOtp: jest.fn().mockResolvedValue(undefined) };
  const mockAiService = {
    moderateText: jest.fn().mockResolvedValue({ isSafe: true }),
  };
  const mockTelegramService = {
    sendMessage: jest.fn().mockResolvedValue(undefined),
  };
  const mockChatGateway = { emitToAdmins: jest.fn() };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .overrideProvider(AIService)
      .useValue(mockAiService)
      .overrideProvider(TelegramService)
      .useValue(mockTelegramService)
      .overrideProvider(ChatGateway)
      .useValue(mockChatGateway)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    redis = app.get<RedisService>(RedisService);

    await prisma.user.deleteMany({ where: { email: 'test-e2e@example.com' } });
    await redis.client.del('otp:email:code:test-e2e@example.com');
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: 'test-e2e@example.com' } });
    await app.close();
  });

  it('/v1/auth/request-email-otp (POST) - should send OTP', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/request-email-otp')
      .send({ email: 'test-e2e@example.com' });

    if (response.status !== 200)
      console.error('request-email-otp error:', response.body);
    expect(response.status).toBe(200);
    expect(response.body.message).toBeDefined();

    const otp = await redis.client.get('otp:email:code:test-e2e@example.com');
    expect(otp).toBeDefined();
  });

  it('/v1/auth/verify-otp (POST) - should register user', async () => {
    const otp = await redis.client.get('otp:email:code:test-e2e@example.com');
    expect(otp).toBeDefined();

    const response = await request(app.getHttpServer())
      .post('/v1/auth/verify-otp')
      .send({
        email: 'test-e2e@example.com',
        otp,
        firstName: 'Ahmad',
        lastName: 'Test',
        password: 'Password123',
      });

    if (response.status !== 200)
      console.error('verify-otp error:', response.body);
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
  });

  it('/v1/auth/login (POST) - should login with password', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'test-e2e@example.com',
        password: 'Password123',
      });

    if (response.status !== 200) console.error('login error:', response.body);
    expect(response.status).toBe(200);
    expect(response.body.accessToken).toBeDefined();
  });
});
