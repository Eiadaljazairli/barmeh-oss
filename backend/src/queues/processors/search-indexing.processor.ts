import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { type Job } from 'bull';
import { SearchService } from '../../search/search.service';

@Processor('search-indexing')
export class SearchIndexingProcessor {
  private readonly logger = new Logger(SearchIndexingProcessor.name);

  constructor(private readonly searchService: SearchService) {}

  @Process('index-listing')
  async handleIndexListing(job: Job<{ listingId: string }>) {
    try {
      this.logger.debug(`Indexing listing ${job.data.listingId}`);
      await this.searchService.indexListingAsync(job.data.listingId);
      return { success: true, listingId: job.data.listingId };
    } catch (error) {
      this.logger.error(
        `Failed to index listing ${job.data.listingId}: ${error}`,
      );
      throw error;
    }
  }

  @Process('delete-from-index')
  async handleDeleteFromIndex(job: Job<{ listingId: string }>) {
    try {
      this.logger.debug(`Removing listing ${job.data.listingId} from index`);
      await this.searchService.deleteFromIndex(job.data.listingId);
      return { success: true, listingId: job.data.listingId };
    } catch (error) {
      this.logger.error(
        `Failed to delete listing from index ${job.data.listingId}: ${error}`,
      );
      throw error;
    }
  }

  @Process('reindex-all')
  async handleReindexAll(_job: Job) {
    try {
      this.logger.log('Starting full reindex...');
      await this.searchService.reindexAllListings();
      return { success: true, message: 'Full reindex completed' };
    } catch (error) {
      this.logger.error(`Full reindex failed: ${error}`);
      throw error;
    }
  }
}
