import { iso2ToIso3Map } from '@/lib/constants/country-alpha-2-to-3';
import { iso3ToName } from '@/lib/constants/country-alpha-3-to-name';
import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { RequestLog } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ILogsGetSuccessResponse = {
  logs: (RequestLog & {
    alpha2: string | null;
    alpha3: string | null;
    country: string | null;
  })[];
  totalLogs: number;
};

export type ILogsGetResponse = ErrorResponse | ILogsGetSuccessResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ILogsGetResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const searchParams = request.nextUrl.searchParams;
    const selectedTeam = getSelectedTeam();

    if (!selectedTeam) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const allowedPageSizes = [10, 25, 50, 100];
    const allowedSortDirections = ['asc', 'desc'];
    const allowedSortColumns = ['createdAt'];

    const search = (searchParams.get('search') as string) || '';

    let timeRange = searchParams.get('timeRange') as string;
    let licenseId = searchParams.get('licenseId') as string;
    let productId = searchParams.get('productId') as string;
    let customerId = searchParams.get('customerId') as string;
    let page = parseInt(searchParams.get('page') as string) || 1;
    let pageSize = parseInt(searchParams.get('pageSize') as string) || 10;
    let sortColumn = searchParams.get('sortColumn') as string;
    let sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc';

    if (
      (licenseId && !regex.uuidV4.test(licenseId)) ||
      (productId && !regex.uuidV4.test(productId)) ||
      (customerId && !regex.uuidV4.test(customerId))
    ) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const timeRanges = ['24h', '7d', '30d', '6m'];
    if (timeRange && !timeRanges.includes(timeRange)) {
      timeRange = '30d';
    }

    if (!allowedSortDirections.includes(sortDirection)) {
      sortDirection = 'desc';
    }

    if (!sortColumn || !allowedSortColumns.includes(sortColumn)) {
      sortColumn = 'createdAt';
    }

    if (!allowedPageSizes.includes(pageSize)) {
      pageSize = 25;
    }

    if (page < 1) {
      page = 1;
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const dateLimit = new Date(
      timeRange === '24h'
        ? new Date().setDate(new Date().getDate() - 1)
        : timeRange === '7d'
          ? new Date().setDate(new Date().getDate() - 7)
          : timeRange === '30d'
            ? new Date().setMonth(new Date().getMonth() - 1)
            : new Date().setMonth(new Date().getMonth() - 6),
    );

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              requestLogs: {
                where: {
                  createdAt: {
                    gte: dateLimit,
                  },
                  licenseId: licenseId ? licenseId : undefined,
                  productId: productId ? productId : undefined,
                  customerId: customerId ? customerId : undefined,
                  ipAddress: search
                    ? {
                        contains: search,
                        mode: 'insensitive',
                      }
                    : undefined,
                },
                orderBy: [
                  {
                    [sortColumn]: sortDirection,
                  },
                ],
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

    const totalLogs = await prisma.requestLog.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
        },
      },
    });

    const requestLogs = session.user.teams[0].requestLogs;

    const requestLogsWithCountries = requestLogs.map((log) => ({
      ...log,
      country: log.country ? iso3ToName[log.country] : null,
      alpha3: log.country ?? null,
      alpha2:
        Object.keys(iso2ToIso3Map).find(
          (key) => iso2ToIso3Map[key] === log.country,
        ) ?? null,
    }));

    return NextResponse.json({
      logs: requestLogsWithCountries,
      totalLogs,
    });
  } catch (error) {
    logger.error("Error occurred in 'logs' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
