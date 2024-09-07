import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

type RequestData = {
  date: string;
  total: number;
  success: number;
  failed: number;
};

export type IDashboardRequestsGetSuccessResponse = {
  data: RequestData[];
};

export type IDashboardRequestsGetResponse =
  | ErrorResponse
  | IDashboardRequestsGetSuccessResponse;

const allowedTimeRanges = ['1h', '24h', '7d', '30d'] as const;

const getStartDate = (timeRange: '1h' | '24h' | '7d' | '30d') => {
  const now = new Date();
  switch (timeRange) {
    case '1h':
      return new Date(now.setHours(now.getHours() - 1));
    case '24h':
      return new Date(now.setHours(now.getHours() - 24));
    case '7d':
      return new Date(now.setDate(now.getDate() - 7));
    case '30d':
      return new Date(now.setDate(now.getDate() - 30));
    default:
      return new Date(now.setHours(now.getHours() - 24));
  }
};

const groupByDateOrHour = (
  data: any[],
  timeRange: '1h' | '24h' | '7d' | '30d',
) => {
  if (timeRange === '1h') {
    return data.reduce(
      (acc, item) => {
        const date = new Date(item.createdAt);
        const minute = date.getUTCMinutes();

        if (!acc[minute]) {
          acc[minute] = { total: 0, success: 0, failed: 0 };
        }

        acc[minute].total += 1;
        if (item.status === 'VALID') {
          acc[minute].success += 1;
        } else {
          acc[minute].failed += 1;
        }

        return acc;
      },
      {} as Record<number, { total: number; success: number; failed: number }>,
    );
  } else if (timeRange === '24h') {
    return data.reduce(
      (acc, item) => {
        const date = new Date(item.createdAt);
        const hour = date.getUTCHours();

        if (!acc[hour]) {
          acc[hour] = { total: 0, success: 0, failed: 0 };
        }

        acc[hour].total += 1;
        if (item.status === 'VALID') {
          acc[hour].success += 1;
        } else {
          acc[hour].failed += 1;
        }

        return acc;
      },
      {} as Record<number, { total: number; success: number; failed: number }>,
    );
  } else {
    return data.reduce(
      (acc, item) => {
        const date = new Date(item.createdAt).toISOString().split('T')[0];

        if (!acc[date]) {
          acc[date] = { total: 0, success: 0, failed: 0 };
        }

        acc[date].total += 1;
        if (item.status === 'VALID') {
          acc[date].success += 1;
        } else {
          acc[date].failed += 1;
        }

        return acc;
      },
      {} as Record<string, { total: number; success: number; failed: number }>,
    );
  }
};

export async function GET(
  request: NextRequest,
): Promise<NextResponse<IDashboardRequestsGetResponse>> {
  const t = await getTranslations({ locale: getLanguage() });
  const searchParams = request.nextUrl.searchParams;

  let timeRange = searchParams.get('timeRange') as '1h' | '24h' | '7d' | '30d';
  if (!timeRange || !allowedTimeRanges.includes(timeRange)) {
    timeRange = '24h';
  }

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
                  createdAt: {
                    gte: getStartDate(timeRange),
                  },
                },
                select: {
                  createdAt: true,
                  status: true,
                },
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

    const requestLogs = session.user.teams[0].requestLogs;

    const filteredData = requestLogs.sort(
      (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );

    const groupedData = groupByDateOrHour(filteredData, timeRange);

    const data = [];

    if (timeRange === '1h') {
      const currentMinute = new Date().getMinutes();
      const startDate = new Date(
        new Date().setMinutes(currentMinute - (60 - 1), 0, 0),
      );

      for (let m = 0; m < 60; m++) {
        const date = new Date(startDate);
        date.setMinutes(date.getMinutes() + m);
        const minuteKey = date.getUTCMinutes();

        data.push({
          date: date.toISOString(),
          total: groupedData[minuteKey]?.total || 0,
          success: groupedData[minuteKey]?.success || 0,
          failed: groupedData[minuteKey]?.failed || 0,
        });
      }
    } else if (timeRange === '24h') {
      const currentHour = new Date().getHours();
      const startDate = new Date(
        new Date().setHours(currentHour - (24 - 1), 0, 0, 0),
      );

      for (let h = 0; h < 24; h++) {
        const date = new Date(startDate);
        date.setHours(date.getHours() + h);
        const hourKey = date.getUTCHours();

        data.push({
          date: date.toISOString(),
          total: groupedData[hourKey]?.total || 0,
          success: groupedData[hourKey]?.success || 0,
          failed: groupedData[hourKey]?.failed || 0,
        });
      }
    } else {
      const startDate = new Date(
        new Date().setDate(
          new Date().getDate() - (timeRange === '7d' ? 7 : 30),
        ),
      );
      const endDate = new Date();

      for (
        let d = new Date(startDate);
        d <= endDate;
        d.setDate(d.getDate() + 1)
      ) {
        const date = d.toISOString().split('T')[0];
        data.push({
          date,
          total: groupedData[date]?.total || 0,
          success: groupedData[date]?.success || 0,
          failed: groupedData[date]?.failed || 0,
        });
      }
    }

    return NextResponse.json({ data });
  } catch (error) {
    logger.error("Error occurred in 'dashboard/requests' route", error);
    return NextResponse.json(
      { message: t('general.server_error') },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
