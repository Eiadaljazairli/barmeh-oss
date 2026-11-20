import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class UserAwareCacheInterceptor extends CacheInterceptor {
  trackBy(context: ExecutionContext): string | undefined {
    const baseKey = super.trackBy(context);
    if (typeof baseKey !== 'string' || baseKey.length === 0) return undefined;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: { sub?: string } }>();
    const userId = request?.user?.sub;
    return `${baseKey}::u=${userId ?? 'anon'}`;
  }
}
