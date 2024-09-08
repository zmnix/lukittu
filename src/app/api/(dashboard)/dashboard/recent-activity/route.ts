import { getSession } from '@/lib/utils/auth';
import { decryptLicenseKey } from '@/lib/utils/crypto';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { RequestStatus } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';

type RecentActivityData = {
  id: string;
  license: string;
  ipAddress: string;
  status: RequestStatus;
  createdAt: Date;
};

export type IDashboardRecentActivityGetSuccessResponse = {
  data: RecentActivityData[];
};

export type IDashboardRecentActivityGetResponse =
  | ErrorResponse
  | IDashboardRecentActivityGetSuccessResponse;

export async function GET(): Promise<
  NextResponse<IDashboardRecentActivityGetResponse>
> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const selectedTeam = getSelectedTeam();

    if (!selectedTeam) {
      return NextResponse.json(
        { message: t('validation.team_not_found') },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              id: selectedTeam,
              deletedAt: null,
            },
            include: {
              requestLogs: {
                where: {
                  licenseId: {
                    not: null,
                  },
                },
                include: {
                  license: true,
                },
                orderBy: {
                  createdAt: 'desc',
                },
                take: 5,
              },
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        { message: t('validation.unauthorized') },
        { status: HttpStatus.UNAUTHORIZED },
      );
    }

    if (!session.user.teams.length) {
      return NextResponse.json(
        { message: t('validation.team_not_found') },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const team = session.user.teams[0];

    const data: RecentActivityData[] = team.requestLogs.map((log) => ({
      id: log.id,
      license: decryptLicenseKey(log.license!.licenseKey),
      ipAddress: log.ipAddress || '',
      status: log.status,
      createdAt: log.createdAt,
    }));

    return NextResponse.json({
      data,
    });
  } catch (error) {
    logger.error("Error occurred in 'dashboard/recent-activity' route", error);
    return NextResponse.json(
      { message: t('general.server_error') },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
