import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { Session, Team, User } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';

export interface SessionWithUserAndTeams extends Session {
  user: User & {
    teams: Team[];
  };
}

export type SessionGetCurrent =
  | {
      session: SessionWithUserAndTeams;
    }
  | ErrorResponse;

export async function GET(): Promise<
  NextResponse<SessionGetCurrent | undefined>
> {
  const t = await getTranslations({ locale: getLanguage() });
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
      { status: 401 },
    );
  }

  return NextResponse.json({
    session,
  });
}
