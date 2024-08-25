import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { Session } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export type ISessionsGetSuccessResponse = {
  sessions: (Omit<Session, 'sessionId'> & { current: boolean })[];
};

export type ISessionsGetResponse = ErrorResponse | ISessionsGetSuccessResponse;

export async function GET(): Promise<NextResponse<ISessionsGetResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const sessionId = cookies().get('session')?.value;
    const session = await getSession({
      user: {
        include: {
          sessions: {
            orderBy: {
              createdAt: 'desc',
            },
            omit: {
              sessionId: false,
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
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    const sessions = session.user.sessions.map((s) => ({
      ...s,
      current: s.sessionId === sessionId,
      sessionId: undefined,
    }));

    return NextResponse.json({
      sessions,
    });
  } catch (error) {
    logger.error("Error occurred in 'sessions' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

type ISignOutAllSessionsSuccessResponse = {
  success: boolean;
};

export type ISignOutAllSessionsResponse =
  | ErrorResponse
  | ISignOutAllSessionsSuccessResponse;

export async function DELETE(): Promise<
  NextResponse<ISignOutAllSessionsResponse>
> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const session = await getSession({ user: true });

    if (!session) {
      return NextResponse.json(
        {
          message: t('validation.unauthorized'),
        },
        { status: HttpStatus.UNAUTHORIZED },
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
  } catch (error) {
    logger.error("Error occurred in 'sessions' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
