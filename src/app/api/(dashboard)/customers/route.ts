import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import {
  setCustomerSchema,
  SetCustomerSchema,
} from '@/lib/validation/customers/set-customer-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { Customer } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ICustomersGetSuccessResponse = {
  customers: Customer[];
  totalCustomers: number;
};

export type ICustomersGetResponse =
  | ErrorResponse
  | ICustomersGetSuccessResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ICustomersGetResponse>> {
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
    const allowedSortColumns = ['fullName', 'createdAt', 'updatedAt', 'email'];

    const search = (searchParams.get('search') as string) || '';

    const licenseId = searchParams.get('licenseId') as string;
    let page = parseInt(searchParams.get('page') as string) || 1;
    let pageSize = parseInt(searchParams.get('pageSize') as string) || 10;
    let sortColumn = searchParams.get('sortColumn') as string;
    let sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc';

    if (licenseId && !regex.uuidV4.test(licenseId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
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

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              customers: {
                where: {
                  licenses: licenseId
                    ? {
                        some: {
                          id: licenseId,
                        },
                      }
                    : undefined,
                  OR: search
                    ? [
                        {
                          email: {
                            contains: search,
                            mode: 'insensitive',
                          },
                        },
                        {
                          fullName: {
                            contains: search,
                            mode: 'insensitive',
                          },
                        },
                      ]
                    : undefined,
                },
                orderBy: {
                  [sortColumn]: sortDirection,
                },
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

    const totalCustomers = await prisma.customer.count({
      where: {
        teamId: selectedTeam,
        licenses: licenseId
          ? {
              some: {
                id: licenseId,
              },
            }
          : undefined,
      },
    });

    const customers = session.user.teams[0].customers;

    return NextResponse.json({
      customers,
      totalCustomers,
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

type ICustomersCreateSuccessResponse = {
  customer: Customer;
};
export type ICustomersCreateResponse =
  | ErrorResponse
  | ICustomersCreateSuccessResponse;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ICustomersCreateResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const body = (await request.json()) as SetCustomerSchema;
    const validated = await setCustomerSchema(t).safeParseAsync(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          field: validated.error.errors[0].path[0],
          message: validated.error.errors[0].message,
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const { email, fullName, metadata } = validated.data;

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
              customers: true,
            },
          },
        },
      },
    });

    if (!session) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
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

    const existingCustomer = team.customers.find(
      (customer) =>
        customer.email &&
        email &&
        customer.email.toLowerCase() === email.toLowerCase(),
    );

    if (existingCustomer) {
      return NextResponse.json(
        {
          message: t('validation.customer_exists'),
          field: 'email',
        },
        { status: HttpStatus.CONFLICT },
      );
    }

    const customer = await prisma.customer.create({
      data: {
        email,
        fullName,
        metadata,
        createdBy: {
          connect: {
            id: session.user.id,
          },
        },
        team: {
          connect: {
            id: team.id,
          },
        },
      },
    });

    return NextResponse.json(
      {
        customer,
      },
      { status: HttpStatus.CREATED },
    );
  } catch (error) {
    logger.error("Error occurred in 'customers' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
