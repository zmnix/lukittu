import { regex } from '@/lib/constants/regex';
import { getSession } from '@/lib/utils/auth';
import { decryptLicenseKey } from '@/lib/utils/crypto';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { Customer, License, Product, RequestLog } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ILicenseGetSuccessResponse = {
  license: Omit<License, 'licenseKeyLookup'> & {
    products: Product[];
    customers: Customer[];
    requestLogs: RequestLog[];
  };
};

export type ILicenseGetResponse = ILicenseGetSuccessResponse | ErrorResponse;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ILicenseGetResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const id = params.slug;

    if (!id || !regex.uuidV4.test(id)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

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
              licenses: {
                where: {
                  id,
                },
                include: {
                  products: true,
                  customers: true,
                  requestLogs: true,
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

    const team = session.user.teams[0];

    if (!team.licenses.length) {
      return NextResponse.json(
        {
          message: t('validation.license_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const license = team.licenses[0];

    license.licenseKey = decryptLicenseKey(license.licenseKey);

    return NextResponse.json({
      license,
    });
  } catch (error) {
    logger.error("Error occurred in 'sessions/[slug]' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
