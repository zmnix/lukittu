import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { Session, Team, User } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';

export type ISessionsGetCurrentSuccessResponse = {
  session: Omit<Session, 'sessionId'> & {
    user: Omit<User, 'passwordHash'> & {
      teams: Team[];
    };
  };
};

export type ISessionsGetCurrentResponse =
  | ISessionsGetCurrentSuccessResponse
  | ErrorResponse;

export async function GET(): Promise<
  NextResponse<ISessionsGetCurrentResponse>
> {
  const t = await getTranslations({ locale: await getLanguage() });

  try {
    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              deletedAt: null,
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

    if (!session.user) {
      return NextResponse.json(
        {
          message: t('validation.unauthorized'),
        },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    const response = {
      session,
    };

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error occurred in 'sessions/current' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
