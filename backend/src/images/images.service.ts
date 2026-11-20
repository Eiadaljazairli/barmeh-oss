import {
  Injectable,
  Logger,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import sharp from 'sharp';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { AIService } from '../ai/ai.service';

@Injectable()
export class ImagesService {
  private readonly logger = new Logger(ImagesService.name);
  private s3Client: S3Client;
  private readonly bucketName: string;
  private readonly useLocalStorage: boolean;
  private readonly publicBaseUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AIService,
    private readonly configService: ConfigService,
  ) {
    const bucketName =
      this.configService.get('S3_BUCKET_NAME') || 'souq-local-images';
    const accessKey = this.configService.get('S3_ACCESS_KEY');

    this.bucketName = bucketName;
    this.useLocalStorage = !accessKey || accessKey === 'dummy';

    this.s3Client = new S3Client({
      region: this.configService.get('S3_REGION') || 'auto',
      endpoint: this.configService.get('S3_ENDPOINT'),
      credentials: {
        accessKeyId: accessKey || 'dummy',
        secretAccessKey: this.configService.get('S3_SECRET_KEY') || 'dummy',
      },
    });

    this.publicBaseUrl = this.useLocalStorage
      ? (this.configService.get('PUBLIC_BASE_URL') ??
        'http://localhost:3000/uploads')
      : (this.configService.get('CDN_URL') ?? '');
  }

  async uploadForListing(
    fileBuffer: Buffer,
    listingId: string,
    userId: string,
  ) {
    if (
      !listingId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        listingId,
      )
    ) {
      throw new BadRequestException('معرف الإعلان غير صالح');
    }
    this.logger.debug(
      `uploadForListing called for listingId: ${listingId}, userId: ${userId}`,
    );
    const listing = await this.prisma.listing.findUnique({
      where: { id: listingId },
      select: { userId: true, _count: { select: { images: true } } },
    });
    if (!listing) throw new NotFoundException('الإعلان غير موجود');
    if (listing.userId !== userId) {
      throw new ForbiddenException('لا تملك صلاحية رفع صور لهذا الإعلان');
    }
    if (listing._count.images >= 8) {
      throw new ForbiddenException('تم الوصول للحد الأقصى من الصور (8)');
    }

    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(fileBuffer).metadata();
    } catch {
      throw new ForbiddenException('الملف ليس صورة صالحة');
    }
    if (!metadata.width || !metadata.height) {
      throw new ForbiddenException('صورة غير صالحة');
    }

    const moderation = await this.ai.moderateImage(
      fileBuffer,
      `image/${metadata.format || 'jpeg'}`,
    );
    if (!moderation.isSafe) {
      this.logger.warn(
        `AI flagged image for listing ${listingId}: ${moderation.reason}`,
      );
      throw new ForbiddenException(`تم رفض الصورة: ${moderation.reason}`);
    }

    let thumbBuffer: Buffer, mediumBuffer: Buffer, pHash: string;
    try {
      [thumbBuffer, mediumBuffer, pHash] = await Promise.all([
        sharp(fileBuffer)
          .rotate()
          .resize({ width: 200, withoutEnlargement: true })
          .webp({ quality: 70 })
          .toBuffer(),
        sharp(fileBuffer)
          .rotate()
          .resize({ width: 800, withoutEnlargement: true })
          .webp({ quality: 80 })
          .toBuffer(),
        this.calculatePHash(fileBuffer),
      ]);
    } catch (e: any) {
      this.logger.error(
        `Image processing failed for listing ${listingId}: ${e.message}`,
      );
      throw new ForbiddenException('فشلت معالجة الصورة');
    }

    this.logger.log(
      `Starting upload for listing ${listingId} by user ${userId}`,
    );

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const thumbKey = `listings/${listingId}/${uniqueId}_thumb.webp`;
    const mediumKey = `listings/${listingId}/${uniqueId}_medium.webp`;

    this.logger.debug(`Uploading thumb: ${thumbKey}`);
    await this.upload(thumbBuffer, thumbKey);

    this.logger.debug(`Uploading medium: ${mediumKey}`);
    await this.upload(mediumBuffer, mediumKey);

    const baseUrl = this.getPublicBaseUrl();
    const thumbUrl = `${baseUrl}/${thumbKey}`;
    const mediumUrl = `${baseUrl}/${mediumKey}`;

    return this.prisma.image.create({
      data: {
        listingId,
        thumbUrl,
        mediumUrl,
        hash: pHash,
        order: listing._count.images,
      },
    });
  }

  async uploadAvatar(fileBuffer: Buffer, userId: string) {
    if (
      !userId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        userId,
      )
    ) {
      throw new BadRequestException('معرف المستخدم غير صالح');
    }
    this.logger.log(`Starting avatar upload for user: ${userId}`);
    let metadata: sharp.Metadata;
    try {
      metadata = await sharp(fileBuffer).metadata();
    } catch {
      throw new ForbiddenException('الملف ليس صورة صالحة');
    }

    const moderation = await this.ai.moderateImage(
      fileBuffer,
      `image/${metadata.format || 'jpeg'}`,
    );
    if (!moderation.isSafe) {
      this.logger.warn(
        `AI flagged avatar for user ${userId}: ${moderation.reason}`,
      );
      throw new ForbiddenException(`تم رفض الصورة: ${moderation.reason}`);
    }

    let avatarBuffer: Buffer;
    try {
      avatarBuffer = await sharp(fileBuffer)
        .rotate()
        .resize({ width: 400, height: 400, fit: 'cover' })
        .webp({ quality: 80 })
        .toBuffer();
    } catch (_e) {
      throw new ForbiddenException('فشلت معالجة الصورة');
    }

    const uniqueId = crypto.randomBytes(8).toString('hex');
    const key = `avatars/${userId}/${uniqueId}.webp`;
    await this.upload(avatarBuffer, key);

    const baseUrl = this.getPublicBaseUrl();
    const url = `${baseUrl}/${key}`;

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: { avatarUrl: url },
    });
    this.logger.log(
      `User ${userId} avatar updated to: ${url}. Success: ${!!updatedUser.avatarUrl}`,
    );

    return { url };
  }

  async resizeImage(imageId: string, _sizes: number[]) {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new NotFoundException('Image not found');
    return { success: true, imageId };
  }

  async optimizeImage(imageId: string) {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new NotFoundException('Image not found');
    return { success: true, imageId };
  }

  async generateThumbnail(imageId: string) {
    const image = await this.prisma.image.findUnique({
      where: { id: imageId },
    });
    if (!image) throw new NotFoundException('Image not found');
    return { success: true, imageId };
  }

  private async calculatePHash(buffer: Buffer): Promise<string> {
    const pixels = await sharp(buffer)
      .resize(8, 8, { fit: 'fill' })
      .greyscale()
      .raw()
      .toBuffer();
    const total = pixels.reduce((acc: number, val: number) => acc + val, 0);
    const avg = total / pixels.length;
    let hash = '';
    for (let i = 0; i < pixels.length; i++) {
      hash += pixels[i] >= avg ? '1' : '0';
    }
    return hash;
  }

  private getPublicBaseUrl(): string {
    if (this.useLocalStorage) {
      return (
        this.configService.get('PUBLIC_BASE_URL') ??
        'http://localhost:3000/uploads'
      );
    }
    return (
      this.configService.get('CDN_URL') ??
      this.configService.get('PUBLIC_BASE_URL') ??
      ''
    );
  }

  private async upload(buffer: Buffer, key: string) {
    if (this.useLocalStorage) {
      const uploadDir = path.join(process.cwd(), 'uploads');
      const filePath = path.join(uploadDir, key);
      const dirPath = path.dirname(filePath);

      this.logger.debug(`Saving to uploadDir: ${uploadDir}`);
      this.logger.debug(`Full filePath: ${filePath}`);

      if (!fs.existsSync(dirPath)) {
        this.logger.debug(`Creating directory: ${dirPath}`);
        fs.mkdirSync(dirPath, { recursive: true });
      }

      try {
        await fs.promises.writeFile(filePath, buffer);
        this.logger.log(`Successfully saved locally: ${filePath}`);
      } catch (err: any) {
        this.logger.error(`Failed to save file: ${err.message}`);
        throw err;
      }
      return;
    }

    await this.s3Client.send(
      new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        Body: buffer,
        ContentType: 'image/webp',
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
  }
}
