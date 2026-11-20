import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
  scryptSync,
} from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly encryptionKey: Buffer;

  constructor(private readonly configService: ConfigService) {
    const keyMaterial = this.configService.get('ENCRYPTION_KEY');
    if (!keyMaterial) {
      throw new Error('ENCRYPTION_KEY not configured in environment');
    }
    this.encryptionKey = scryptSync(keyMaterial, 'barmeh_salt_2026', 32);
  }

  encrypt(plaintext: string): string {
    try {
      const iv = randomBytes(16);
      const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);

      const encrypted =
        cipher.update(plaintext, 'utf8', 'hex') + cipher.final('hex');
      const authTag = cipher.getAuthTag();

      const combined = `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
      return Buffer.from(combined).toString('base64');
    } catch (_error) {
      throw new BadRequestException('Failed to encrypt data');
    }
  }

  decrypt(ciphertext: string): string {
    try {
      const combined = Buffer.from(ciphertext, 'base64').toString('utf8');
      const [ivHex, authTagHex, encryptedHex] = combined.split(':');

      if (!ivHex || !authTagHex || !encryptedHex) {
        throw new Error('Invalid ciphertext format');
      }

      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.encryptionKey,
        Buffer.from(ivHex, 'hex'),
      );
      decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

      const decrypted =
        decipher.update(encryptedHex, 'hex', 'utf8') + decipher.final('utf8');
      return decrypted;
    } catch (_error) {
      throw new BadRequestException(
        'Failed to decrypt data or authentication failed',
      );
    }
  }
}
