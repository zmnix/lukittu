import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';

type CardData = {
  activeLicenses: number;
  totalLicenses: number;
  totalProducts: number;
  totalCustomers: number;
  trends: {
    activeLicensesPreviousPeriod: number;
    licensesLastWeek: number;
    productsLastWeek: number;
    customersLastWeek: number;
  };
};

export type IStatisticsCardDataGetSuccessResponse = {
  data: CardData;
};

export type IStatisticsCardDataGetResponse =
  | ErrorResponse
  | IStatisticsCardDataGetSuccessResponse;

export async function GET(): Promise<
  NextResponse<IStatisticsCardDataGetResponse>
> {
  const t = await getTranslations({ locale: await getLanguage() });

  try {
    const selectedTeam = await getSelectedTeam();

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
              settings: true,
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
                include: {
                  heartbeats: true,
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
    const settings = team.settings;
    const heartbeatTimeout = settings?.heartbeatTimeout || 60; // Minutes

    const heartbeats = team.licenses
      .flatMap((license) => license.heartbeats)
      .filter(
        (heartbeat) =>
          new Date(heartbeat.lastBeatAt) >=
          new Date(new Date().getTime() - heartbeatTimeout * 60 * 2 * 1000),
      );

    const activeHeartbeats = heartbeats.filter(
      (heartbeat) =>
        new Date(heartbeat.lastBeatAt) >=
        new Date(new Date().getTime() - heartbeatTimeout * 60 * 1000),
    );

    const activeLicensesPreviousPeriod =
      heartbeats.length - activeHeartbeats.length;

    const data: CardData = {
      totalLicenses: team.licenses.length,
      totalProducts: team.products.length,
      totalCustomers: team.customers.length,
      activeLicenses: activeHeartbeats.length,
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
        activeLicensesPreviousPeriod,
      },
    };

    return NextResponse.json({ data });
  } catch (error) {
    logger.error("Error occurred in 'dashboard/card-data' route", error);
    return NextResponse.json(
      { message: t('general.server_error') },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
