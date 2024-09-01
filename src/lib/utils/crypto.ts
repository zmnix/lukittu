import crypto from 'crypto';
import 'server-only';
import { logger } from './logger';

export function hashPassword(password: string) {
  const iterations = 100000;
  const keyLength = 64;
  const digest = 'sha512';

  try {
    const salt = crypto.randomBytes(16);
    const hash = crypto.pbkdf2Sync(
      password,
      salt,
      iterations,
      keyLength,
      digest,
    );
    return `${iterations}:${keyLength}:${salt.toString('hex')}:${hash.toString('hex')}`;
  } catch (error) {
    logger.error('Error occurred in hashPassword:', error);
    throw new Error('Hashing failed');
  }
}

export function verifyPassword(password: string, storedHash: string) {
  try {
    const [iterations, keyLength, saltHex, originalHash] =
      storedHash.split(':');
    const salt = Buffer.from(saltHex, 'hex');
    const verifyHash = crypto
      .pbkdf2Sync(
        password,
        salt,
        parseInt(iterations, 10),
        parseInt(keyLength, 10),
        'sha512',
      )
      .toString('hex');
    return verifyHash === originalHash;
  } catch (error) {
    logger.error('Error occurred in verifyPassword:', error);
    throw new Error('Verification failed');
  }
}

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!;
const HMAC_KEY = process.env.HMAC_KEY!;
const IV_LENGTH = 16;

export function encryptLicenseKey(licenseKey: string): string {
  try {
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );

    let encrypted = cipher.update(licenseKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag().toString('hex');

    return `${iv.toString('hex')}:${encrypted}:${authTag}`;
  } catch (error) {
    logger.error('Error occurred in encryptLicenseKey:', error);
    throw new Error('Encryption failed');
  }
}

export function decryptLicenseKey(encryptedString: string): string {
  try {
    const [ivHex, encryptedData, authTagHex] = encryptedString.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');

    const decipher = crypto.createDecipheriv(
      'aes-256-gcm',
      Buffer.from(ENCRYPTION_KEY),
      iv,
    );
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (error) {
    logger.error('Error occurred in decryptLicenseKey:', error);
    throw new Error('Decryption failed');
  }
}
export function generateHMAC(licenseKey: string): string {
  try {
    return crypto
      .createHmac('sha256', HMAC_KEY)
      .update(licenseKey)
      .digest('hex');
  } catch (error) {
    logger.error('Error occurred in generateHMAC:', error);
    throw new Error('HMAC generation failed');
  }
}
