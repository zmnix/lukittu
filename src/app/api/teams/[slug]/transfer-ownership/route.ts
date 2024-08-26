import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

type ITeamsTransferOwnershipRequest = {
  newOwnerId: number;
};

type ITeamsTransferOwnershipSuccessResponse = {
  success: boolean;
};

export type ITeamsTransferOwnershipResponse =
  | ErrorResponse
  | ITeamsTransferOwnershipSuccessResponse;

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ITeamsTransferOwnershipResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const body = (await request.json()) as ITeamsTransferOwnershipRequest;
    const teamId = parseInt(params.slug);

    if (isNaN(teamId) || teamId <= 0) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const newOwnerId = body.newOwnerId;

    if (isNaN(newOwnerId) || newOwnerId <= 0) {
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

    const team = session.user.teams.find((t) => t.id === teamId);

    if (!team) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (team.ownerId !== session.user.id) {
      return NextResponse.json(
        {
          message: t('validation.unauthorized'),
        },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    if (!team.users.find((u) => u.id === newOwnerId)) {
      return NextResponse.json(
        {
          message: t('validation.user_not_in_team'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        ownerId: newOwnerId,
      },
    });

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error(
      "Error occurred in 'teams/[slug]/transfer-ownership' route",
      error,
    );
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
