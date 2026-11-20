import { Controller, Get, UseInterceptors } from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';

@Controller()
export class AppController {
  @Get()
  getHello() {
    return {
      message: 'Welcome to Barmeh API (V1)',
      status: 'Ready',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }

  @Get('cache-test')
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(5000)
  cacheTest() {
    return {
      message: 'Cache test response',
      timestamp: new Date().toISOString(),
      random: Math.random(),
    };
  }
}
