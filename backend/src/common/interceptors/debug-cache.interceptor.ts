import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ExecutionContext, Injectable, Inject } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import type { Cache } from 'cache-manager';

@Injectable()
export class DebugCacheInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  intercept(context: ExecutionContext, next: any): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const path = request.path || request.url;

    console.log(`[CacheDebug] Interceptor called for: ${path}`);

    return next.handle().pipe(
      tap(() => {
        console.log(`[CacheDebug] Response received for ${path}`);
      }),
    );
  }
}
