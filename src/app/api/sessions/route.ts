import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { Session } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export type SessionsGetResponse =
  | ErrorResponse
  | {
      sessions: (Session & { current: boolean })[];
    };

export type SignOutAllSessionResponse = ErrorResponse | { success: boolean };

export async function GET(): Promise<NextResponse<SessionsGetResponse>> {
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

export async function DELETE(): Promise<
  NextResponse<SignOutAllSessionResponse>
> {
  const t = await getTranslations({ locale: getLanguage() });
  const session = await getSession({ user: true });

  if (!session) {
    return NextResponse.json(
      {
        message: t('validation.unauthorized'),
      },
      { status: 401 },
    );
  }

  await prisma.session.deleteMany({
    where: {
      userId: session.user.id,
      sessionId: {
        not: session.sessionId,
      },
    },
  });

  return NextResponse.json({
    success: true,
  });
}
