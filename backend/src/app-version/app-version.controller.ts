import { Controller, Get } from '@nestjs/common';

@Controller('app')
export class AppVersionController {
  @Get('version')
  getVersion() {
    return {
      android: {
        latest: process.env.MOBILE_ANDROID_LATEST || '1.1.0',
        min: process.env.MOBILE_ANDROID_MIN || '1.1.0',
        storeUrl: process.env.MOBILE_ANDROID_STORE_URL || '',
      },
      ios: {
        latest: process.env.MOBILE_IOS_LATEST || '1.0.4',
        min: process.env.MOBILE_IOS_MIN || '1.0.0',
        storeUrl: process.env.MOBILE_IOS_STORE_URL || '',
      },
    };
  }
}
