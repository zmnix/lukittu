/* eslint-disable lines-around-comment */
import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { generateHMAC, signChallenge } from '@/lib/utils/crypto';
import { getIp } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import {
  VerifyLicenseSchema,
  verifyLicenseSchema,
} from '@/lib/validation/licenses/verify-license-schema';
import { HttpStatus } from '@/types/http-status';
import { RequestStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

type IExternalLicenseVerifyResponse = {
  // TODO: @KasperiP: Return license data
  data: any;
  result: {
    timestamp: Date;
    valid: boolean;
    details: string;
    code: RequestStatus;
    challengeResponse?: string;
  };
};

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<IExternalLicenseVerifyResponse>> {
  const requestTime = new Date();
  const teamId = params.slug;

  try {
    if (!teamId || !regex.uuidV4.test(teamId)) {
      return await handleResponse({
        request,
        requestTime,
        status: RequestStatus.BAD_REQUEST,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'Invalid team UUID',
          },
        },
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    const body = (await request.json()) as VerifyLicenseSchema;
    const validated = await verifyLicenseSchema().safeParseAsync(body);

    if (!validated.success) {
      return await handleResponse({
        request,
        requestTime,
        status: RequestStatus.BAD_REQUEST,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: validated.error.errors[0].message,
          },
        },
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    const { licenseKey, customerId, productId, challenge } = validated.data;

    const licenseKeyLookup = generateHMAC(`${licenseKey}:${teamId}`);

    const license = await prisma.license.findUnique({
      where: {
        team: {
          deletedAt: null,
        },
        teamId_licenseKeyLookup: { teamId, licenseKeyLookup },
      },
      include: {
        customers: {
          where: {
            id: customerId,
          },
        },
        products: {
          where: {
            id: productId,
          },
        },
        team: {
          omit: {
            privateKeyRsa: false,
          },
        },
        requestLogs: true,
      },
    });

    if (!license) {
      return await handleResponse({
        request,
        requestTime,
        status: RequestStatus.LICENSE_NOT_FOUND,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'License not found',
          },
        },
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    if (license.suspended) {
      return await handleResponse({
        request,
        requestTime,
        teamId,
        status: RequestStatus.LICENSE_SUSPENDED,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'License suspended',
          },
        },
        httpStatus: HttpStatus.FORBIDDEN,
      });
    }

    if (license.expirationType === 'DATE') {
      const expirationDate = new Date(license.expirationDate!);
      const currentDate = new Date();

      if (currentDate.getTime() > expirationDate.getTime()) {
        return await handleResponse({
          request,
          requestTime,
          teamId,
          status: RequestStatus.LICENSE_EXPIRED,
          response: {
            data: null,
            result: {
              timestamp: new Date(),
              valid: false,
              details: 'License expired',
            },
          },
          httpStatus: HttpStatus.FORBIDDEN,
        });
      }
    }

    if (license.expirationType === 'DURATION') {
      const hasStartedExpiring = Boolean(license.expirationDate);

      if (!hasStartedExpiring) {
        const expirationDays = license.expirationDays!;
        const expirationDate = new Date(
          new Date().getTime() + expirationDays * 24 * 60 * 60 * 1000,
        );

        await prisma.license.update({
          where: { teamId_licenseKeyLookup: { teamId, licenseKeyLookup } },
          data: {
            expirationDate,
          },
        });
      } else {
        const expirationDate = new Date(license.expirationDate!);
        const currentDate = new Date();

        if (currentDate.getTime() > expirationDate.getTime()) {
          return await handleResponse({
            request,
            requestTime,
            teamId,
            status: RequestStatus.LICENSE_EXPIRED,
            response: {
              data: null,
              result: {
                timestamp: new Date(),
                valid: false,
                details: 'License expired',
              },
            },
            httpStatus: HttpStatus.FORBIDDEN,
          });
        }
      }
    }

    const hasCustomer = Boolean(license.customers?.[0]);
    const hasProduct = Boolean(license.products?.[0]);

    if (customerId && !hasCustomer) {
      return await handleResponse({
        request,
        requestTime,
        teamId,
        productId: hasProduct ? productId : undefined,
        status: RequestStatus.CUSTOMER_NOT_FOUND,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'Customer not found',
          },
        },
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    if (productId && !hasProduct) {
      return await handleResponse({
        request,
        requestTime,
        teamId,
        customerId: hasCustomer ? customerId : undefined,
        status: RequestStatus.PRODUCT_NOT_FOUND,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'Product not found',
          },
        },
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    if (license.ipLimit) {
      const ipAddress = getIp();
      const existingIps = license.requestLogs.map((log) => log.ipAddress);
      const ipLimitReached = existingIps.length >= license.ipLimit;

      // TODO: @KasperiP: Maybe add separate table for storing IP addresses because user's probably want to also remove old IP addresses
      if (!existingIps.includes(ipAddress) && ipLimitReached) {
        return await handleResponse({
          request,
          requestTime,
          teamId,
          status: RequestStatus.IP_LIMIT_REACHED,
          response: {
            data: null,
            result: {
              timestamp: new Date(),
              valid: false,
              details: 'IP limit reached',
            },
          },
          httpStatus: HttpStatus.FORBIDDEN,
        });
      }
    }

    const challengeResponse = challenge
      ? signChallenge(challenge, license.team.privateKeyRsa)
      : undefined;

    return await handleResponse({
      request,
      requestTime,
      teamId,
      status: RequestStatus.VALID,
      response: {
        data: null,
        result: {
          timestamp: new Date(),
          valid: true,
          details: 'License is valid',
          challengeResponse,
        },
      },
      httpStatus: HttpStatus.OK,
    });
  } catch (error) {
    logger.error("Error occurred in 'license/verify' route", error);

    if (error instanceof SyntaxError) {
      return await handleResponse({
        request,
        requestTime,
        status: RequestStatus.BAD_REQUEST,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'Invalid JSON payload',
          },
        },
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    return await handleResponse({
      request,
      requestTime,
      status: RequestStatus.INTERNAL_SERVER_ERROR,
      response: {
        data: null,
        result: {
          timestamp: new Date(),
          valid: false,
          details: 'Internal server error',
        },
      },
      httpStatus: HttpStatus.INTERNAL_SERVER_ERROR,
    });
  }
}

interface LogRequestProps {
  request: NextRequest;
  requestTime: Date;
  status: RequestStatus;
  customerId?: string;
  productId?: string;
  licenseKeyLookup?: string;
  teamId?: string;
}

async function logRequest({
  requestTime,
  status,
  customerId,
  productId,
  licenseKeyLookup,
  teamId,
}: LogRequestProps) {
  try {
    const ipAddress = getIp();
    const geoData = await fetch(`http://ip-api.com/json/${ipAddress}`);
    const geoDataJson = geoData.ok ? await geoData.json() : null;
    const country: string | null = geoDataJson ? geoDataJson.country : null;

    await prisma.requestLog.create({
      data: {
        responseTime: new Date().getTime() - requestTime.getTime(),
        status,
        ipAddress,
        country,
        customer: customerId ? { connect: { id: customerId } } : undefined,
        product: productId ? { connect: { id: productId } } : undefined,
        license:
          licenseKeyLookup && teamId
            ? {
                connect: {
                  teamId_licenseKeyLookup: {
                    teamId,
                    licenseKeyLookup,
                  },
                },
              }
            : undefined,
      },
    });
  } catch (error) {
    logger.error("Error logging request in 'license/verify' route", error);
  }
}

interface HandleResponseProps {
  request: NextRequest;
  requestTime: Date;
  status: RequestStatus;
  response: {
    data: any;
    result: {
      timestamp: Date;
      valid: boolean;
      details: string;
      challengeResponse?: string;
    };
  };
  httpStatus: HttpStatus;
  customerId?: string;
  productId?: string;
  teamId?: string;
  licenseKeyLookup?: string;
}

async function handleResponse({
  request,
  requestTime,
  status,
  teamId,
  response,
  httpStatus,
  customerId,
  productId,
  licenseKeyLookup,
}: HandleResponseProps): Promise<NextResponse<IExternalLicenseVerifyResponse>> {
  await logRequest({
    request,
    requestTime,
    status,
    customerId,
    productId,
    licenseKeyLookup,
    teamId,
  });

  return NextResponse.json(
    {
      data: response.data,
      result: {
        timestamp: response.result.timestamp,
        valid: response.result.valid,
        details: response.result.details,
        code: status,
        challengeResponse: response.result.challengeResponse,
      },
    },
    { status: httpStatus },
  );
}
