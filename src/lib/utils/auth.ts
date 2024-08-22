import prisma from '@/lib/database/prisma';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { cookies } from 'next/headers';
import { cache } from 'react';
import 'server-only';
import { getIp, getUserAgent } from './header-helpers';
import { logger } from './logger';

export async function createSession(userId: number, rememberMe: boolean) {
  try {
    const ipAddress = getIp();
    const userAgent = getUserAgent();

    const geoData = await fetch(`http://ip-api.com/json/${ipAddress}`);
    const geoDataJson = geoData.ok ? await geoData.json() : null;
    const country: string | null = geoDataJson ? geoDataJson.country : null;

    const sessionId = randomBytes(16).toString('hex');

    const expiresAt = rememberMe
      ? new Date(Date.now() + 1000 * 60 * 60 * 24 * 30)
      : new Date(Date.now() + 1000 * 60 * 60 * 24);

    const session = await prisma.session.create({
      data: {
        sessionId: sessionId,
        userId,
        expiresAt,
        ipAddress,
        country,
        userAgent,
      },
    });

    cookies().set('session', sessionId, {
      expires: expiresAt,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    });

    return session;
  } catch (error) {
    logger.error('Error creating session', error);
    return null;
  }
}

export const getSession = cache(
  async <T extends Prisma.SessionInclude>(include: T | null = null) => {
    const sessionId = cookies().get('session')?.value;

    if (!sessionId) return null;

    const session = await prisma.session.findUnique({
      where: {
        sessionId,
        expiresAt: {
          gte: new Date(),
        },
      },
      include,
    });

    if (!session) return null;

    // TODO: Improve type.
    return {
      ...session,
      sessionId,
    } as Prisma.SessionGetPayload<{ include: T }>;
  },
);
