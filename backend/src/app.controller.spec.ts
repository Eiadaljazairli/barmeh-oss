import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [{ provide: CACHE_MANAGER, useValue: {} }],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return welcome payload with status Ready', () => {
      const result = appController.getHello();
      expect(result).toMatchObject({
        message: expect.any(String),
        status: 'Ready',
        version: expect.any(String),
      });
      expect(result.timestamp).toEqual(expect.any(String));
    });
  });
});
