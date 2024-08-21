import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type TeamLeaveResponse =
  | ErrorResponse
  | {
      success: boolean;
    };

export async function POST(
  _: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<TeamLeaveResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  const teamId = parseInt(params.slug);

  if (isNaN(teamId) || teamId <= 0) {
    return NextResponse.json(
      {
        message: t('validation.bad_request'),
      },
      { status: 400 },
    );
  }

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

  const team = session.user.teams.find((t) => t.id === teamId);

  if (!team) {
    return NextResponse.json(
      {
        message: t('validation.team_not_found'),
      },
      { status: 404 },
    );
  }

  if (team.ownerId === session.user.id) {
    return NextResponse.json(
      {
        message: t('validation.team_owner_cannot_leave'),
      },
      { status: 400 },
    );
  }

  await prisma.team.update({
    where: {
      id: teamId,
    },
    data: {
      users: {
        disconnect: {
          id: session.user.id,
        },
      },
    },
  });

  return NextResponse.json({
    success: true,
  });
}
