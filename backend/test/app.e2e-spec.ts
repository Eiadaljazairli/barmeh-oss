import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { AIService } from '../src/ai/ai.service';
import { SearchService } from '../src/search/search.service';
import { MailService } from '../src/mail/mail.service';
import { TelegramService } from '../src/telegram/telegram.service';
import { ChatGateway } from '../src/chat/chat.gateway';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AIService)
      .useValue({})
      .overrideProvider(SearchService)
      .useValue({})
      .overrideProvider(MailService)
      .useValue({})
      .overrideProvider(TelegramService)
      .useValue({})
      .overrideProvider(ChatGateway)
      .useValue({})
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect((res) => {
        expect(res.body.message).toContain('Barmeh API');
      });
  });

  afterEach(async () => {
    await app.close();
  });
});
