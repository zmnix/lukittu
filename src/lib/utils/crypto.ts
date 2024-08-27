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
