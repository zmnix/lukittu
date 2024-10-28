import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { logger } from '@/lib/logging/logger';
import { getSession } from '@/lib/security/session';
import { iso3toIso2, iso3ToName } from '@/lib/utils/country-helpers';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { Prisma, RequestLog } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';

export type ILogsGetSuccessResponse = {
  logs: (RequestLog & {
    alpha2: string | null;
    alpha3: string | null;
    country: string | null;
    browser: string | null;
    os: string | null;
  })[];
  totalResults: number;
};

export type ILogsGetResponse = ErrorResponse | ILogsGetSuccessResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ILogsGetResponse>> {
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

    const allowedPageSizes = [10, 25, 50, 100];
    const allowedSortDirections = ['asc', 'desc'];
    const allowedSortColumns = ['createdAt'];

    const search = (searchParams.get('search') as string) || '';

    let timeRange = searchParams.get('timeRange') as string;
    const licenseId = searchParams.get('licenseId') as string;
    const productId = searchParams.get('productId') as string;
    const customerId = searchParams.get('customerId') as string;
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

    const timeRanges = ['24h', '7d', '30d'];
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

    const team = await prisma.team.findUnique({
      where: {
        id: selectedTeam,
      },
      include: {
        limits: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const DAYS_IN_MONTH = 30;
    const SIX_MONTHS_IN_DAYS = 6 * DAYS_IN_MONTH;

    const teamLogRetentionDays =
      team.limits?.logRetention ?? SIX_MONTHS_IN_DAYS;
    const teamLogRetentionInMonths = Math.floor(
      teamLogRetentionDays / DAYS_IN_MONTH,
    );

    const now = new Date();
    let dateLimit: Date;

    switch (timeRange) {
      case '24h':
        dateLimit = new Date(now.setDate(now.getDate() - 1));
        break;
      case '7d':
        dateLimit = new Date(now.setDate(now.getDate() - 7));
        break;
      case '30d':
        dateLimit = new Date(now.setMonth(now.getMonth() - 1));
        break;
      default:
        dateLimit = new Date(
          now.setMonth(now.getMonth() - teamLogRetentionInMonths),
        );
    }

    const whereWithoutTeamCheck = {
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
    } as Prisma.RequestLogWhereInput;

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
                where: whereWithoutTeamCheck,
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

    const totalResults = await prisma.requestLog.count({
      where: {
        ...whereWithoutTeamCheck,
        teamId: selectedTeam,
      },
    });

    const requestLogs = session.user.teams[0].requestLogs;

    const requestLogsWithCountries = requestLogs.map((log) => {
      let browser: string | null = null;
      let os: string | null = null;

      if (log.userAgent) {
        const parser = new UAParser(log.userAgent);
        const browserObj = parser.getBrowser();
        const osObj = parser.getOS();

        browser = browserObj.name ?? null;
        os = osObj.name ?? null;
      }

      return {
        ...log,
        country: iso3ToName(log.country),
        alpha3: log.country ?? null,
        alpha2: iso3toIso2(log.country),
        browser,
        os,
      };
    });

    return NextResponse.json({
      logs: requestLogsWithCountries,
      totalResults,
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
