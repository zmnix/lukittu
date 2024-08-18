import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  setTeamSchema,
  SetTeamSchema,
} from '@/lib/validation/team/set-team-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { Team, User } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

export interface TeamWithUsers extends Team {
  users: User[];
}

export type TeamsGetResponse = ErrorResponse | { teams: TeamWithUsers[] };

export type TeamsPostResponse =
  | ErrorResponse
  | {
      team: Team;
    };

export async function GET(): Promise<
  NextResponse<TeamsGetResponse | undefined>
> {
  const t = await getTranslations({ locale: getLanguage() });
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
      { status: 401 },
    );
  }

  return NextResponse.json({
    teams: session.user.teams,
  });
}

export async function POST(
  request: NextRequest,
): Promise<NextResponse<TeamsPostResponse>> {
  const body = (await request.json()) as SetTeamSchema;

  const t = await getTranslations({ locale: getLanguage() });
  const validated = await setTeamSchema(t).safeParseAsync(body);

  if (!validated.success) {
    return NextResponse.json(
      {
        message: validated.error.errors[0].message,
        field: validated.error.errors[0].path[0],
      },
      { status: 400 },
    );
  }

  const { name, id } = validated.data;

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

  if (id && !session.user.teams.some((team) => team.id === id)) {
    return NextResponse.json(
      {
        message: t('validation.team_not_found'),
        field: 'id',
      },
      { status: 404 },
    );
  }

  const createdTeam = await prisma.team.upsert({
    where: {
      id: id || 0,
    },
    create: {
      name,
      ownerId: session.user.id,
      users: {
        connect: {
          id: session.user.id,
        },
      },
    },
    update: {
      name,
    },
  });

  cookies().set('selectedTeam', createdTeam.id.toString(), {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5),
  });

  return NextResponse.json({
    team: createdTeam,
  });
}
