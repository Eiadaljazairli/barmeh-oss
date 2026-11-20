import { Injectable, Inject } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheInvalidationListener {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  @OnEvent('category.updated')
  async handleCategoryUpdated() {
    const store = (this.cacheManager as any).store;
    if (store && typeof store.keys === 'function') {
      const keys = await store.keys('*/categories*');
      for (const key of keys) {
        await this.cacheManager.del(key);
      }
    }
    console.log('Successfully invalidated category cache');
  }

  @OnEvent('listing.updated')
  async handleListingUpdated(listing: any) {
    await this.cacheManager.del(`/v1/listings/${listing.id}`);

    const store = (this.cacheManager as any).store;
    if (store && typeof store.keys === 'function') {
      const keys = await store.keys('*/listings*');
      for (const key of keys) {
        await this.cacheManager.del(key);
      }
    }
    console.log(`Successfully invalidated cache for listing: ${listing.id}`);
  }
}
