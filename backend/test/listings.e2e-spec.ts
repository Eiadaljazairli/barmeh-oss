import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { MailService } from '../src/mail/mail.service';
import { AIService } from '../src/ai/ai.service';
import { SearchService } from '../src/search/search.service';
import { RedisService } from '../src/redis/redis.service';

describe('Listings (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;
  let listingId: string;

  const mockMailService = { sendOtp: jest.fn().mockResolvedValue(undefined) };
  const mockAiService = {
    moderateText: jest.fn().mockResolvedValue({ isSafe: true }),
  };
  const mockSearchService = {
    indexListing: jest.fn().mockResolvedValue(undefined),
    removeListing: jest.fn().mockResolvedValue(undefined),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(MailService)
      .useValue(mockMailService)
      .overrideProvider(AIService)
      .useValue(mockAiService)
      .overrideProvider(SearchService)
      .useValue(mockSearchService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }),
    );
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
    const redis = app.get<RedisService>(RedisService);

    await prisma.listing.deleteMany({
      where: { user: { email: 'listing-e2e@example.com' } },
    });
    await prisma.user.deleteMany({
      where: { email: 'listing-e2e@example.com' },
    });
    await redis.client.del('otp:email:code:listing-e2e@example.com');

    await prisma.category.upsert({
      where: { id: 'test-category' },
      update: {},
      create: {
        id: 'test-category',
        nameAr: 'قسم تجريبي',
        nameEn: 'Test Category',
        slug: 'test-category',
        icon: 'test-icon',
      },
    });

    await request(app.getHttpServer())
      .post('/v1/auth/request-email-otp')
      .send({ email: 'listing-e2e@example.com' });

    const otp = await redis.client.get(
      'otp:email:code:listing-e2e@example.com',
    );

    const regRes = await request(app.getHttpServer())
      .post('/v1/auth/verify-otp')
      .send({
        email: 'listing-e2e@example.com',
        otp,
        firstName: 'Listing',
        lastName: 'Tester',
        password: 'Password123',
      });

    accessToken = regRes.body.accessToken;
    userId = regRes.body.user.id;
  });

  afterAll(async () => {
    if (userId) {
      await prisma.listing.deleteMany({ where: { userId } });
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await app.close();
  });

  it('/v1/listings (POST) - should create a listing', async () => {
    const response = await request(app.getHttpServer())
      .post('/v1/listings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        title: 'Test Listing E2E',
        description: 'This is a test listing description from E2E test.',
        price: 1000,
        priceStatus: 'FIXED',
        categoryId: 'test-category',
        city: 'DAMASCUS',
      });

    if (response.status !== 201)
      console.error('create listing error:', response.body);
    expect(response.status).toBe(201);
    expect(response.body.title).toBe('Test Listing E2E');
    listingId = response.body.id;
  });

  it('/v1/listings/:id (GET) - should get listing details', async () => {
    const response = await request(app.getHttpServer()).get(
      `/v1/listings/${listingId}`,
    );

    expect(response.status).toBe(200);
    expect(response.body.id).toBe(listingId);
  });

  it('/v1/listings/:id/favorite (POST) - should toggle favorite', async () => {
    const response = await request(app.getHttpServer())
      .post(`/v1/listings/${listingId}/favorite`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(201);
    expect(response.body.favorited).toBeDefined();
  });

  it('/v1/listings/:id/delete (POST) - should remove listing', async () => {
    const response = await request(app.getHttpServer())
      .post(`/v1/listings/${listingId}/delete`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(response.status).toBe(201);
  });
});
