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

export async function GET(
  request: NextRequest,
): Promise<NextResponse<IDashboardRequestsGetResponse>> {
  const t = await getTranslations({ locale: getLanguage() });
  const searchParams = request.nextUrl.searchParams;

  const allowedTimeRanges = ['24h', '7d', '30d'];
  let timeRange = searchParams.get('timeRange') as '24h' | '7d' | '30d';

  if (!timeRange || !allowedTimeRanges.includes(timeRange)) {
    timeRange = '24h';
  }

  try {
    const selectedTeam = getSelectedTeam();

    if (!selectedTeam) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
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
                    gte: new Date(
                      timeRange === '7d'
                        ? new Date().setDate(new Date().getDate() - 7)
                        : timeRange === '30d'
                          ? new Date().setDate(new Date().getDate() - 30)
                          : new Date().setHours(new Date().getHours() - 24),
                    ),
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

    const requestLogs = session.user.teams[0].requestLogs;

    const filteredData = requestLogs
      .filter((item) => {
        const date = new Date(item.createdAt);
        if (timeRange === '7d') {
          return date > new Date(new Date().setDate(new Date().getDate() - 7));
        }

        if (timeRange === '30d') {
          return date > new Date(new Date().setDate(new Date().getDate() - 30));
        }

        return true;
      })
      .sort((a, b) => {
        const dateA = new Date(a.createdAt);
        const dateB = new Date(b.createdAt);
        return dateA.getTime() - dateB.getTime();
      });

    if (timeRange !== '24h') {
      const groupedData = filteredData.reduce(
        (acc, item) => {
          const date = new Date(item.createdAt).toISOString().split('T')[0];

          if (!acc[date]) {
            acc[date] = {
              total: 0,
              success: 0,
              failed: 0,
            };
          }

          acc[date].total += 1;

          if (item.status === 'VALID') {
            acc[date].success += 1;
          } else {
            acc[date].failed += 1;
          }

          return acc;
        },
        {} as Record<
          string,
          { total: number; success: number; failed: number }
        >,
      );

      const startDate = new Date(
        new Date().setDate(
          new Date().getDate() - (timeRange === '7d' ? 7 : 30),
        ),
      );
      const endDate = new Date();

      const data = [];
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

      return NextResponse.json({
        data,
      });
    }
    const groupedData = filteredData.reduce(
      (acc, item) => {
        const date = new Date(item.createdAt);
        const hour = date.getUTCHours();

        if (!acc[hour]) {
          acc[hour] = {
            total: 0,
            success: 0,
            failed: 0,
          };
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

    const currentHour = new Date().getHours();

    const startDate = new Date(new Date().setHours(currentHour - 23, 0, 0, 0));

    const data = [];

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

    return NextResponse.json({
      data,
    });
  } catch (error) {
    logger.error("Error occurred in 'dashboard/requests' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
