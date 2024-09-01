import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

type ITeamsLeaveSuccessResponse = {
  success: boolean;
};

export type ITeamsLeaveResponse = ErrorResponse | ITeamsLeaveSuccessResponse;

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ITeamsLeaveResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const teamId = params.slug;

    if (!teamId || !regex.uuidV4.test(teamId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
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
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    const team = session.user.teams.find((t) => t.id === teamId);

    if (!team) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (team.ownerId === session.user.id) {
      return NextResponse.json(
        {
          message: t('validation.team_owner_cannot_leave'),
        },
        { status: HttpStatus.BAD_REQUEST },
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
  } catch (error) {
    logger.error("Error occurred in 'teams/[slug]/leave' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
