import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';

type CardData = {
  totalLicenses: number;
  totalProducts: number;
  totalCustomers: number;
  requestsLast24h: {
    success: number;
    failed: number;
  };
  trends: {
    licensesLastWeek: number;
    productsLastWeek: number;
    customersLastWeek: number;
    requestsComparedToPreviousDay: number;
  };
};

export type IDashboardCardDataGetSuccessResponse = {
  data: CardData;
};

export type IDashboardCardDataGetResponse =
  | ErrorResponse
  | IDashboardCardDataGetSuccessResponse;

export async function GET(): Promise<
  NextResponse<IDashboardCardDataGetResponse>
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
              products: {
                select: {
                  createdAt: true,
                },
              },
              customers: {
                select: {
                  createdAt: true,
                },
              },
              licenses: {
                select: {
                  createdAt: true,
                },
              },
              requestLogs: {
                where: {
                  createdAt: {
                    gte: new Date(
                      new Date().setDate(new Date().getDate() - 1 * 2),
                    ),
                  },
                },
                select: {
                  status: true,
                  createdAt: true,
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

    const team = session.user.teams[0];

    const requestsLast24h = team.requestLogs.filter(
      (request) =>
        new Date(request.createdAt) >=
        new Date(new Date().setDate(new Date().getDate() - 1)),
    );

    const data: CardData = {
      totalLicenses: team.licenses.length,
      totalProducts: team.products.length,
      totalCustomers: team.customers.length,
      requestsLast24h: {
        success: requestsLast24h.filter((request) => request.status === 'VALID')
          .length,
        failed: requestsLast24h.filter((request) => request.status !== 'VALID')
          .length,
      },
      trends: {
        licensesLastWeek: team.licenses.filter(
          (license) =>
            new Date(license.createdAt) >=
            new Date(new Date().setDate(new Date().getDate() - 7)),
        ).length,
        productsLastWeek: team.products.filter(
          (product) =>
            new Date(product.createdAt) >=
            new Date(new Date().setDate(new Date().getDate() - 7)),
        ).length,
        customersLastWeek: team.customers.filter(
          (customer) =>
            new Date(customer.createdAt) >=
            new Date(new Date().setDate(new Date().getDate() - 7)),
        ).length,
        requestsComparedToPreviousDay:
          team.requestLogs.length - requestsLast24h.length,
      },
    };

    return NextResponse.json({ data });
  } catch (error) {
    logger.error("Error occurred in 'dashboard/requests' route", error);
    return NextResponse.json(
      { message: t('general.server_error') },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
