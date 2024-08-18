import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { Session } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export type SessionGet =
  | ErrorResponse
  | {
      sessions: (Session & { current: boolean })[];
    };

export async function GET(): Promise<NextResponse<SessionGet | undefined>> {
  const t = await getTranslations({ locale: getLanguage() });
  const sessionId = cookies().get('session')?.value;
  const session = await getSession({
    user: {
      include: {
        sessions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    },
  });

  if (!session) {
    return NextResponse.json(
      {
        message: t('validation.unauthorized'),
      },
      { status: 401 },
    );
  }

  const sessions = session.user.sessions.map((s) => ({
    ...s,
    current: s.sessionId === sessionId,
  }));

  return NextResponse.json({
    sessions,
  });
}
