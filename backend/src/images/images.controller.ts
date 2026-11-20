import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImagesService } from './images.service';
import type { Express } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const ALLOWED_MIME = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
];

@Controller('images')
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post('upload/:listingId')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
    }),
  )
  async uploadImage(
    @Request() req: any,
    @Param('listingId') listingId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('لم يتم إرسال ملف');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مدعوم');
    }
    return this.imagesService.uploadForListing(
      file.buffer,
      listingId,
      req.user.sub,
    );
  }

  @Post('avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_IMAGE_SIZE_BYTES, files: 1 },
    }),
  )
  async uploadAvatar(
    @Request() req: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) throw new BadRequestException('لم يتم إرسال ملف');
    if (!ALLOWED_MIME.includes(file.mimetype)) {
      throw new BadRequestException('نوع الملف غير مدعوم');
    }
    return this.imagesService.uploadAvatar(file.buffer, req.user.sub);
  }
}
