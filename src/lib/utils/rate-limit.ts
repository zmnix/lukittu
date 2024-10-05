import { redisClient } from '../database/redis';
import { logger } from './logger';

export async function isRateLimited(
  key: string,
  maxRequests: number,
  limitWindow: number,
) {
  const rateLimitKey = `rate_limit:${key}`;

  try {
    const currentCount = await redisClient.get(rateLimitKey);

    const currentRequests = currentCount ? parseInt(currentCount) : 0;

    if (currentCount) {
      const currentExpiration = await redisClient.ttl(rateLimitKey);
      limitWindow = currentExpiration > 0 ? currentExpiration : limitWindow;
    }

    await redisClient.set(rateLimitKey, currentRequests + 1, 'EX', limitWindow);

    return currentRequests >= maxRequests;
  } catch (error) {
    logger.error('Error checking rate limit', error);
    return false;
  }
}
