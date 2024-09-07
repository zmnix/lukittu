import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import {
  decryptLicenseKey,
  encryptLicenseKey,
  generateHMAC,
} from '@/lib/utils/crypto';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import {
  SetLicenseScheama,
  setLicenseSchema,
} from '@/lib/validation/licenses/set-license-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { Customer, License, Product, RequestLog, User } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ILicenseGetSuccessResponse = {
  license: Omit<License, 'licenseKeyLookup'> & {
    products: Product[];
    customers: Customer[];
    requestLogs: RequestLog[];
    createdBy: Omit<User, 'passwordHash'> | null;
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
                  products: {
                    orderBy: {
                      createdAt: 'desc',
                    },
                  },
                  customers: {
                    orderBy: {
                      createdAt: 'desc',
                    },
                  },
                  requestLogs: {
                    orderBy: {
                      createdAt: 'desc',
                    },
                    take: 7,
                  },
                  createdBy: true,
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

export type ILicensesUpdateResponse =
  | ErrorResponse
  | ILicensesUpdateSuccessResponse;

export type ILicensesUpdateSuccessResponse = {
  license: Omit<License, 'licenseKeyLookup'>;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ILicensesUpdateResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const licenseId = params.slug;

    if (!licenseId || !regex.uuidV4.test(licenseId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const body = (await request.json()) as SetLicenseScheama;
    const validated = await setLicenseSchema(t).safeParseAsync(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          field: validated.error.errors[0].path[0],
          message: validated.error.errors[0].message,
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const {
      customerIds,
      expirationDate,
      expirationDays,
      expirationStart,
      expirationType,
      ipLimit,
      licenseKey,
      metadata,
      productIds,
      suspended,
    } = body;

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
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              licenses: true,
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

    const hmac = generateHMAC(`${licenseKey}:${team.id}`);

    const licenseExists = await prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!licenseExists) {
      return NextResponse.json(
        {
          message: t('validation.license_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const isLicenseKeyInUse = team.licenses.some(
      (license) =>
        license.licenseKeyLookup === hmac && license.id !== licenseId,
    );

    if (isLicenseKeyInUse) {
      return NextResponse.json(
        {
          message: t('validation.license_key_exists'),
          field: 'licenseKey',
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const productsPromise = prisma.product.findMany({
      where: {
        teamId: team.id,
        id: {
          in: productIds,
        },
      },
    });

    const customersPromise = prisma.customer.findMany({
      where: {
        teamId: team.id,
        id: {
          in: customerIds,
        },
      },
    });

    const [products, customers] = await Promise.all([
      productsPromise,
      customersPromise,
    ]);

    if (products.length !== productIds.length) {
      return NextResponse.json(
        {
          message: t('validation.product_not_found'),
          field: 'productIds',
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (customers.length !== customerIds.length) {
      return NextResponse.json(
        {
          message: t('validation.customer_not_found'),
          field: 'customerIds',
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const encryptedLicenseKey = encryptLicenseKey(licenseKey);

    const updatedLicense = await prisma.license.update({
      where: { id: licenseId },
      data: {
        expirationDate,
        expirationDays,
        expirationStart: expirationStart || 'CREATION',
        expirationType,
        ipLimit,
        licenseKey: encryptedLicenseKey,
        licenseKeyLookup: hmac,
        metadata,
        suspended,
        products: {
          set: productIds.map((id) => ({ id })),
        },
        customers: {
          set: customerIds.map((id) => ({ id })),
        },
      },
    });

    return NextResponse.json({
      license: {
        ...updatedLicense,
        licenseKey,
        licenseKeyLookup: undefined,
      },
    });
  } catch (error) {
    logger.error("Error occurred in 'update license' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
