import { Processor, Process } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { type Job } from 'bull';
import { ImagesService } from '../../images/images.service';

@Processor('image-processing')
export class ImageProcessingProcessor {
  private readonly logger = new Logger(ImageProcessingProcessor.name);

  constructor(private readonly imagesService: ImagesService) {}

  @Process('resize-image')
  async handleResizeImage(job: Job<{ imageId: string; sizes: number[] }>) {
    try {
      this.logger.debug(`Resizing image ${job.data.imageId}`);
      await this.imagesService.resizeImage(job.data.imageId, job.data.sizes);
      return { success: true, imageId: job.data.imageId };
    } catch (error) {
      this.logger.error(`Failed to resize image ${job.data.imageId}: ${error}`);
      throw error;
    }
  }

  @Process('optimize-image')
  async handleOptimizeImage(job: Job<{ imageId: string }>) {
    try {
      this.logger.debug(`Optimizing image ${job.data.imageId}`);
      await this.imagesService.optimizeImage(job.data.imageId);
      return { success: true, imageId: job.data.imageId };
    } catch (error) {
      this.logger.error(
        `Failed to optimize image ${job.data.imageId}: ${error}`,
      );
      throw error;
    }
  }

  @Process('generate-thumbnail')
  async handleGenerateThumbnail(job: Job<{ imageId: string }>) {
    try {
      this.logger.debug(`Generating thumbnail for image ${job.data.imageId}`);
      await this.imagesService.generateThumbnail(job.data.imageId);
      return { success: true, imageId: job.data.imageId };
    } catch (error) {
      this.logger.error(
        `Failed to generate thumbnail for ${job.data.imageId}: ${error}`,
      );
      throw error;
    }
  }
}
