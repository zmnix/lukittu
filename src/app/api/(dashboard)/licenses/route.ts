import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { createAuditLog } from '@/lib/utils/audit-log';
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
import {
  AuditLogAction,
  AuditLogTargetType,
  Customer,
  License,
  Prisma,
  Product,
} from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ILicensesGetSuccessResponse = {
  licenses: (Omit<License, 'licenseKeyLookup'> & {
    products: Product[];
    customers: Customer[];
  })[];
  totalResults: number;
  hasResults: boolean;
};

export type ILicensesGetResponse = ErrorResponse | ILicensesGetSuccessResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ILicensesGetResponse>> {
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
    const allowedSortColumns = ['createdAt', 'updatedAt'];

    const search = (searchParams.get('search') as string) || '';

    let page = parseInt(searchParams.get('page') as string) || 1;
    let pageSize = parseInt(searchParams.get('pageSize') as string) || 10;
    let sortColumn = searchParams.get('sortColumn') as string;
    let sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc';
    const productIds = (searchParams.get('productIds') as string) || '';
    const customerIds = (searchParams.get('customerIds') as string) || '';

    const productIdsFormatted: string[] = [];
    const customerIdsFormatted: string[] = [];

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

    if (productIds) {
      productIds.split(',').forEach((id) => {
        if (regex.uuidV4.test(id)) {
          productIdsFormatted.push(id);
        }
      });
    }

    if (customerIds) {
      customerIds.split(',').forEach((id) => {
        if (regex.uuidV4.test(id)) {
          customerIdsFormatted.push(id);
        }
      });
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const isFullLicense = search.match(
      /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/,
    );

    const licenseKeyLookup = isFullLicense
      ? generateHMAC(`${search}:${selectedTeam}`)
      : undefined;

    const whereWithoutTeamCheck = {
      licenseKeyLookup,
      products: productIdsFormatted.length
        ? {
            some: {
              id: {
                in: productIdsFormatted,
              },
            },
          }
        : undefined,
      customers: customerIdsFormatted.length
        ? {
            some: {
              id: {
                in: customerIdsFormatted,
              },
            },
          }
        : undefined,
    } as Prisma.LicenseWhereInput;

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              licenses: {
                where: whereWithoutTeamCheck,
                skip,
                take,
                orderBy: {
                  [sortColumn]: sortDirection,
                },
                include: {
                  products: true,
                  customers: true,
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

    const [hasResults, totalResults] = await prisma.$transaction([
      prisma.license.findFirst({
        where: {
          teamId: selectedTeam,
        },
        select: {
          id: true,
        },
      }),
      prisma.license.count({
        where: {
          ...whereWithoutTeamCheck,
          teamId: selectedTeam,
        },
      }),
    ]);

    const licenses = session.user.teams[0].licenses.map((license) => ({
      ...license,
      licenseKey: decryptLicenseKey(license.licenseKey),
      licenseKeyLookup: undefined,
    }));

    return NextResponse.json({
      licenses,
      totalResults,
      hasResults: Boolean(hasResults),
    });
  } catch (error) {
    logger.error("Error occurred in 'products' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

export type ILicensesCreateResponse =
  | ErrorResponse
  | ILicensesCreateSuccessResponse;

export type ILicensesCreateSuccessResponse = {
  license: Omit<License, 'licenseKeyLookup'>;
};
export async function POST(
  request: NextRequest,
): Promise<NextResponse<ILicensesCreateResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
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

    const licenseExists = team.licenses.find(
      (license) => license.licenseKeyLookup === hmac,
    );

    if (licenseExists) {
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

    const license = await prisma.license.create({
      data: {
        expirationDate,
        expirationDays,
        expirationStart: expirationStart || 'CREATION',
        expirationType,
        ipLimit,
        licenseKey: encryptedLicenseKey,
        licenseKeyLookup: hmac,
        metadata,
        suspended: false,
        teamId: team.id,
        products: productIds.length
          ? { connect: productIds.map((id) => ({ id })) }
          : undefined,
        customers: customerIds.length
          ? { connect: customerIds.map((id) => ({ id })) }
          : undefined,
        createdByUserId: session.user.id,
      },
    });

    const response = {
      license: {
        ...license,
        licenseKey,
        licenseKeyLookup: undefined,
      },
    };

    createAuditLog({
      userId: session.user.id,
      teamId: team.id,
      action: AuditLogAction.CREATE_LICENSE,
      targetId: license.id,
      targetType: AuditLogTargetType.LICENSE,
      requestBody: body,
      responseBody: response,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error occurred in 'licenses' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
