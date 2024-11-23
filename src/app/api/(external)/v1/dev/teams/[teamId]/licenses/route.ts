import prisma from '@/lib/database/prisma';
import { sendLicenseDistributionEmail } from '@/lib/emails/templates/send-license-distribution-email';
import { generateUniqueLicense } from '@/lib/licenses/generate-license';
import { createAuditLog } from '@/lib/logging/audit-log';
import { logger } from '@/lib/logging/logger';
import { verifyApiAuthorization } from '@/lib/security/api-key-auth';
import { encryptLicenseKey, generateHMAC } from '@/lib/security/crypto';
import {
  CreateLicenseSchema,
  createLicenseSchema,
} from '@/lib/validation/licenses/set-license-schema';
import { IExternalDevResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { AuditLogAction, AuditLogTargetType } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ teamId: string }> },
): Promise<NextResponse<IExternalDevResponse>> {
  const params = await props.params;

  try {
    const { teamId } = params;

    const body = (await request.json()) as CreateLicenseSchema;
    const validated = await createLicenseSchema().safeParseAsync(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          data: null,
          result: {
            details: validated.error.errors[0].message,
            timestamp: new Date(),
            valid: false,
          },
        },
        {
          status: HttpStatus.BAD_REQUEST,
        },
      );
    }

    const {
      customerIds,
      expirationDate,
      expirationDays,
      expirationStart,
      expirationType,
      ipLimit,
      metadata,
      productIds,
      seats,
      suspended,
      sendEmailDelivery,
    } = body;

    const { team } = await verifyApiAuthorization(teamId);

    if (!team) {
      return NextResponse.json(
        {
          data: null,
          result: {
            details: 'Invalid API key',
            timestamp: new Date(),
            valid: false,
          },
        },
        {
          status: HttpStatus.UNAUTHORIZED,
        },
      );
    }

    const licenseAmount = await prisma.license.count({
      where: {
        teamId,
      },
    });

    if (licenseAmount >= team.limits.maxLicenses) {
      return NextResponse.json(
        {
          data: null,
          result: {
            details: 'Max licenses reached',
            timestamp: new Date(),
            valid: false,
          },
        },
        {
          status: HttpStatus.FORBIDDEN,
        },
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
          data: null,
          result: {
            details: 'Invalid productIds',
            timestamp: new Date(),
            valid: false,
          },
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (customers.length !== customerIds.length) {
      return NextResponse.json(
        {
          data: null,
          result: {
            details: 'Invalid customerIds',
            timestamp: new Date(),
            valid: false,
          },
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const licenseKey = await generateUniqueLicense(teamId);

    if (!licenseKey) {
      return NextResponse.json(
        {
          data: null,
          result: {
            details: 'Failed to generate license key',
            timestamp: new Date(),
            valid: false,
          },
        },
        {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
        },
      );
    }

    const encryptedLicenseKey = encryptLicenseKey(licenseKey);
    const hmac = generateHMAC(`${licenseKey}:${team.id}`);

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
        suspended,
        teamId: team.id,
        seats,
        products: productIds.length
          ? { connect: productIds.map((id) => ({ id })) }
          : undefined,
        customers: customerIds.length
          ? { connect: customerIds.map((id) => ({ id })) }
          : undefined,
      },
      include: {
        customers: true,
        products: true,
      },
    });

    if (sendEmailDelivery) {
      const customerEmails = license.customers
        .filter((customer) => customerIds.includes(customer.id))
        .map((customer) => customer.email)
        .filter(Boolean) as string[];

      if (customerEmails.length) {
        const emails = license.customers
          .filter((customer) => customer.email)
          .map(
            async (customer) =>
              await sendLicenseDistributionEmail({
                customer,
                licenseKey,
                license,
                team,
              }),
          );

        await Promise.all(emails);
      }
    }

    const response: IExternalDevResponse = {
      data: {
        ...license,
        licenseKey,
        licenseKeyLookup: undefined,
      },
      result: {
        details: 'License created',
        timestamp: new Date(),
        valid: true,
      },
    };

    createAuditLog({
      system: true,
      teamId: team.id,
      action: AuditLogAction.CREATE_LICENSE,
      targetId: license.id,
      targetType: AuditLogTargetType.LICENSE,
      requestBody: body,
      responseBody: response,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error(
      "Error in '(external)/v1/dev/teams/[teamId]/licenses' route",
      error,
    );
    return NextResponse.json(
      {
        data: null,
        result: {
          details: 'Internal server error',
          timestamp: new Date(),
          valid: false,
        },
      },
      {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      },
    );
  }
}
