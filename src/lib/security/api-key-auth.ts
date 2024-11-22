import crypto from 'crypto';
import { headers } from 'next/headers';
import 'server-only';
import prisma from '../database/prisma';
import { logger } from '../logging/logger';

export const verifyApiAuthorization = async (
  teamId: string,
): Promise<boolean> => {
  try {
    const headersList = await headers();
    const authHeader = headersList.get('authorization');

    if (!authHeader?.toLowerCase().startsWith('bearer ')) {
      return false;
    }

    const providedKey = authHeader.substring(7);
    const hashedProvidedKey = crypto
      .createHash('sha256')
      .update(providedKey)
      .digest('hex');

    const team = await prisma.team.findUnique({
      where: {
        id: teamId,
      },
      include: {
        apiKeys: {
          where: {
            key: hashedProvidedKey,
          },
          omit: {
            key: false,
          },
        },
      },
    });

    if (!team || !team.apiKeys.length) {
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Error in verifyApiAuthorization', error);
    return false;
  }
};
