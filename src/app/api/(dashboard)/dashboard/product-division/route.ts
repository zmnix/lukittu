import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';

type DivisonData = {
  id: string;
  name: string;
  licenses: number;
};

export type IDashboardProductDivisionGetSuccessResponse = {
  data: DivisonData[];
};

export type IDashboardProductDivisionGetResponse =
  | ErrorResponse
  | IDashboardProductDivisionGetSuccessResponse;

export async function GET(): Promise<
  NextResponse<IDashboardProductDivisionGetResponse>
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
                include: {
                  _count: {
                    select: {
                      licenses: true,
                    },
                  },
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

    const products = session.user.teams[0].products;

    const data = products.map((product) => ({
      id: product.id,
      name: product.name,
      licenses: product._count.licenses,
    }));

    return NextResponse.json({
      data,
    });
  } catch (error) {
    logger.error("Error occurred in 'dashboard/requests' route", error);
    return NextResponse.json(
      { message: t('general.server_error') },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
