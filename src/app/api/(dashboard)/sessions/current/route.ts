import { getGravatarUrl } from '@/lib/providers/gravatar';
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
    user: User & {
      teams: Team[];
      avatarUrl: string;
    };
  };
};

export type ISessionsGetCurrentResponse =
  | ISessionsGetCurrentSuccessResponse
  | ErrorResponse;

export async function GET(): Promise<
  NextResponse<ISessionsGetCurrentResponse>
> {
  const t = await getTranslations({ locale: getLanguage() });

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
      session: {
        ...session,
        user: {
          ...session.user,
          avatarUrl: getGravatarUrl(session.user.email),
        },
      },
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
