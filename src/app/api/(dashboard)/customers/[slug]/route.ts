import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { createAuditLog } from '@/lib/utils/audit-log';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import {
  setCustomerSchema,
  SetCustomerSchema,
} from '@/lib/validation/customers/set-customer-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import {
  AuditLogAction,
  AuditLogTargetType,
  Customer,
  User,
} from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ICustomerGetSuccessResponse = {
  customer: Customer & {
    createdBy: Omit<User, 'passwordHash'> | null;
  };
};

export type ICustomerGetResponse = ICustomerGetSuccessResponse | ErrorResponse;

export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ICustomerGetResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const customerId = params.slug;

    if (!customerId || !regex.uuidV4.test(customerId)) {
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
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              customers: {
                where: {
                  id: customerId,
                },
                include: {
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

    if (!team.customers.length) {
      return NextResponse.json(
        {
          message: t('validation.customer_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const customer = team.customers[0];

    return NextResponse.json(
      {
        customer,
      },
      { status: HttpStatus.OK },
    );
  } catch (error) {
    logger.error("Error occurred in 'customers/[slug]' route:", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

export type ICustomersUpdateResponse =
  | ErrorResponse
  | ICustomersUpdateSuccessResponse;

export type ICustomersUpdateSuccessResponse = {
  customer: Customer;
};

export async function PUT(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ICustomersUpdateResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const customerId = params.slug;

    if (!customerId || !regex.uuidV4.test(customerId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

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
              customers: {
                where: {
                  OR: [
                    {
                      email,
                    },
                    {
                      id: customerId,
                    },
                  ],
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

    if (
      !team.customers.length ||
      !team.customers.find((c) => c.id === customerId)
    ) {
      return NextResponse.json(
        {
          message: t('validation.customer_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const emailAlreadyInUse = team.customers.length > 1;
    if (emailAlreadyInUse) {
      return NextResponse.json(
        {
          message: t('validation.customer_exists'),
          field: 'email',
        },
        { status: HttpStatus.CONFLICT },
      );
    }

    const updatedCustomer = await prisma.customer.update({
      where: {
        id: customerId,
      },
      data: {
        email,
        fullName,
        metadata,
      },
    });

    const response = {
      customer: updatedCustomer,
    };

    createAuditLog({
      userId: session.user.id,
      teamId: team.id,
      action: AuditLogAction.UPDATE_CUSTOMER,
      targetId: customerId,
      targetType: AuditLogTargetType.CUSTOMER,
      requestBody: body,
      responseBody: response,
    });

    return NextResponse.json(response, { status: HttpStatus.OK });
  } catch (error) {
    logger.error("Error occurred in 'customers/[slug]' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

type ICustomersDeleteSuccessResponse = {
  success: boolean;
};

export type ICustomersDeleteResponse =
  | ErrorResponse
  | ICustomersDeleteSuccessResponse;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ICustomersDeleteResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const customerId = params.slug;

    if (!customerId || !regex.uuidV4.test(customerId)) {
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
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              customers: {
                where: {
                  id: customerId,
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

    if (!team.customers.length) {
      return NextResponse.json(
        {
          message: t('validation.customer_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    await prisma.customer.delete({
      where: {
        id: customerId,
      },
    });

    const response = {
      success: true,
    };

    createAuditLog({
      userId: session.user.id,
      teamId: team.id,
      action: AuditLogAction.DELETE_CUSTOMER,
      targetId: customerId,
      targetType: AuditLogTargetType.CUSTOMER,
      requestBody: null,
      responseBody: response,
    });

    return NextResponse.json(response, { status: HttpStatus.OK });
  } catch (error) {
    logger.error("Error occurred in 'customers/[slug]' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
