import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import {
  setTeamSchema,
  SetTeamSchema,
} from '@/lib/validation/team/set-team-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { Team, User } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export type ITeamsGetSuccessResponse = {
  teams: (Team & {
    users: Omit<User, 'passwordHash'>[];
  })[];
};

export type ITeamsGetResponse = ErrorResponse | ITeamsGetSuccessResponse;

export async function GET(): Promise<
  NextResponse<ITeamsGetResponse | undefined>
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
            include: {
              users: true,
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

    return NextResponse.json({
      teams: session.user.teams,
    });
  } catch (error) {
    logger.error("Error occurred in 'teams' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

type ITeamsCreateSuccessResponse = {
  team: Team;
};

export type ITeamsCreateResponse = ErrorResponse | ITeamsCreateSuccessResponse;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ITeamsCreateResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const body = (await request.json()) as SetTeamSchema;
    const validated = await setTeamSchema(t).safeParseAsync(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          message: validated.error.errors[0].message,
          field: validated.error.errors[0].path[0],
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const { name } = validated.data;

    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        {
          message: t('validation.unauthorized'),
        },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    const createdTeam = await prisma.team.create({
      data: {
        name,
        ownerId: session.user.id,
        users: {
          connect: {
            id: session.user.id,
          },
        },
      },
    });

    cookies().set('selectedTeam', createdTeam.id.toString(), {
      expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5),
    });

    return NextResponse.json({
      team: createdTeam,
    });
  } catch (error) {
    logger.error("Error occurred in 'teams' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
