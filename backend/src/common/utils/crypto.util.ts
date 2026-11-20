import * as crypto from 'crypto';

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || 'default_secret_key_32_bytes_long!';
const ENCRYPTION_PREFIX = 'enc:';

export function encryptPhone(phone: string): string {
  if (!phone) return phone;
  if (phone.startsWith(ENCRYPTION_PREFIX)) return phone;

  const iv = crypto
    .createHash('md5')
    .update(phone + ENCRYPTION_KEY)
    .digest();

  const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(phone, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  return ENCRYPTION_PREFIX + iv.toString('hex') + ':' + encrypted;
}

export function decryptPhone(encryptedPhone: string): string {
  if (!encryptedPhone || !encryptedPhone.startsWith(ENCRYPTION_PREFIX)) {
    return encryptedPhone;
  }

  try {
    const parts = encryptedPhone.substring(ENCRYPTION_PREFIX.length).split(':');
    if (parts.length !== 2) return encryptedPhone;

    const iv = Buffer.from(parts[0], 'hex');
    const encryptedText = Buffer.from(parts[1], 'hex');

    const key = crypto.createHash('sha256').update(ENCRYPTION_KEY).digest();

    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText, undefined, 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.error('Failed to decrypt phone:', err);
    return encryptedPhone;
  }
}
