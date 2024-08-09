'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { getTranslations } from 'next-intl/server';

export default async function signoutSession(sessionId: string) {
  const t = await getTranslations({ locale: getLanguage() });

  if (!sessionId || typeof sessionId !== 'string') {
    return {
      isError: true,
      message: t('validation.invalid_session'),
    };
  }

  const session = await getSession({
    user: {
      include: {
        sessions: true,
      },
    },
  });

  const sessionToLogout = session.user.sessions.find(
    (s) => s.sessionId === sessionId,
  );

  if (!sessionToLogout) {
    return {
      isError: true,
      message: t('validation.invalid_session'),
    };
  }

  await prisma.session.delete({
    where: {
      userId: session.user.id,
      sessionId,
    },
  });

  return {
    isError: false,
  };
}
