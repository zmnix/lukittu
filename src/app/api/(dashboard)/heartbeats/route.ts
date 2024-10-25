import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { logger } from '@/lib/logging/logger';
import { getSession } from '@/lib/security/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { Heartbeat, Prisma } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

type HeartbeatStatus = 'active' | 'inactive';

export type ILicenseHeartbeatsGetSuccessResponse = {
  heartbeats: (Heartbeat & {
    status: HeartbeatStatus;
  })[];
  totalResults: number;
};

export type ILicenseHeartbeatsGetResponse =
  | ErrorResponse
  | ILicenseHeartbeatsGetSuccessResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ILicenseHeartbeatsGetResponse>> {
  const t = await getTranslations({ locale: await getLanguage() });

  try {
    const searchParams = request.nextUrl.searchParams;
    const selectedTeam = await getSelectedTeam();

    if (!selectedTeam) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const licenseId = searchParams.get('licenseId') as string;
    const allowedPageSizes = [10, 25, 50, 100];
    const allowedSortDirections = ['asc', 'desc'];
    const allowedSortColumns = ['lastBeatAt'];

    let page = parseInt(searchParams.get('page') as string) || 1;
    let pageSize = parseInt(searchParams.get('pageSize') as string) || 10;
    let sortColumn = searchParams.get('sortColumn') as string;
    let sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc';

    if (licenseId && !regex.uuidV4.test(licenseId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (!allowedSortDirections.includes(sortDirection)) {
      sortDirection = 'desc';
    }

    if (!sortColumn || !allowedSortColumns.includes(sortColumn)) {
      sortColumn = 'lastBeatAt';
    }

    if (!allowedPageSizes.includes(pageSize)) {
      pageSize = 25;
    }

    if (page < 1) {
      page = 1;
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const whereWithoutTeamCheck = {
      licenseId,
    } as Prisma.HeartbeatWhereInput;

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              settings: true,
              heartbeats: {
                where: whereWithoutTeamCheck,
                orderBy: {
                  [sortColumn]: sortDirection,
                },
                skip,
                take,
              },
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

    if (!session.user.teams.length) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const team = session.user.teams[0];

    const totalResults = await prisma.heartbeat.count({
      where: {
        ...whereWithoutTeamCheck,
        teamId: selectedTeam,
      },
    });

    const heartbeats = team.heartbeats;

    const heartbeatsWithStatus = heartbeats.map((heartbeat) => {
      const heartbeatTimeout = team.settings?.heartbeatTimeout || 60;

      const lastBeatAt = new Date(heartbeat.lastBeatAt);
      const now = new Date();

      const diff = Math.abs(now.getTime() - lastBeatAt.getTime());
      const minutes = Math.floor(diff / 1000 / 60);

      const status: HeartbeatStatus =
        minutes <= heartbeatTimeout ? 'active' : 'inactive';

      return {
        ...heartbeat,
        status,
      };
    });

    return NextResponse.json({
      heartbeats: heartbeatsWithStatus,
      totalResults,
    });
  } catch (error) {
    logger.error("Error occurred in 'products' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
