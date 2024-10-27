import { iso2ToIso3Map } from '@/lib/constants/country-alpha-2-to-3';
import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { logger } from '@/lib/logging/logger';
import {
  ExternalVerifyResponse,
  loggedResponse,
} from '@/lib/logging/request-log';
import { proxyCheck } from '@/lib/providers/proxycheck';
import { generateHMAC, signChallenge } from '@/lib/security/crypto';
import { isRateLimited } from '@/lib/security/rate-limiter';
import { getIp } from '@/lib/utils/header-helpers';
import {
  VerifyLicenseSchema,
  verifyLicenseSchema,
} from '@/lib/validation/licenses/verify-license-schema';
import { HttpStatus } from '@/types/http-status';
import { BlacklistType, IpLimitPeriod, RequestStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> },
): Promise<NextResponse<ExternalVerifyResponse>> {
  const params = await props.params;
  const requestTime = new Date();
  const teamId = params.slug;

  const loggedResponseBase = {
    body: null,
    request,
    requestTime,
  };

  try {
    if (!teamId || !regex.uuidV4.test(teamId)) {
      return loggedResponse({
        ...loggedResponseBase,
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
      return loggedResponse({
        ...loggedResponseBase,
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

    const ip = await getIp();
    if (ip) {
      const key = `license-verify:${ip}`;
      const isLimited = await isRateLimited(key, 25, 60); // 25 requests per minute

      if (isLimited) {
        return loggedResponse({
          ...loggedResponseBase,
          status: RequestStatus.RATE_LIMIT,
          response: {
            data: null,
            result: {
              timestamp: new Date(),
              valid: false,
              details: 'Rate limited',
            },
          },
          httpStatus: HttpStatus.TOO_MANY_REQUESTS,
        });
      }
    }

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        keyPair: {
          omit: {
            privateKey: false,
          },
        },
        blacklist: true,
        settings: true,
      },
    });

    const settings = team?.settings;

    if (!team || !settings) {
      return loggedResponse({
        ...loggedResponseBase,
        status: RequestStatus.TEAM_NOT_FOUND,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'Team not found',
          },
        },
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    const { licenseKey, customerId, productId, challenge, deviceIdentifier } =
      validated.data;

    const licenseKeyLookup = generateHMAC(`${licenseKey}:${teamId}`);

    const ipLimitPeriodDays =
      settings.ipLimitPeriod === IpLimitPeriod.DAY
        ? 1
        : settings.ipLimitPeriod === IpLimitPeriod.WEEK
          ? 7
          : 30;

    const ipLimitPeriodDate = new Date(
      new Date().getTime() - ipLimitPeriodDays * 24 * 60 * 60 * 1000,
    );

    const license = await prisma.license.findUnique({
      where: {
        team: {
          deletedAt: null,
        },
        teamId_licenseKeyLookup: { teamId, licenseKeyLookup },
      },
      include: {
        customers: true,
        products: true,
        heartbeats: true,
        requestLogs: {
          where: {
            createdAt: {
              gte: ipLimitPeriodDate,
            },
          },
        },
      },
    });

    const licenseHasCustomers = Boolean(license?.customers.length);
    const licenseHasProducts = Boolean(license?.products.length);

    const hasStrictProducts = settings.strictProducts || false;
    const hasStrictCustomers = settings.strictCustomers || false;

    const matchingCustomer = license?.customers.find(
      (customer) => customer.id === customerId,
    );

    const matchingProduct = license?.products.find(
      (product) => product.id === productId,
    );

    if (!license) {
      return loggedResponse({
        ...loggedResponseBase,
        teamId,
        customerId: matchingCustomer ? customerId : undefined,
        productId: matchingProduct ? productId : undefined,
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

    const blacklistedIps = team.blacklist.filter(
      (b) => b.type === BlacklistType.IP_ADDRESS,
    );
    const blacklistedIpList = blacklistedIps.map((b) => b.value);

    if (ip && blacklistedIpList.includes(ip)) {
      await updateBlacklistHits(teamId, BlacklistType.IP_ADDRESS, ip);

      return loggedResponse({
        ...loggedResponseBase,
        teamId,
        customerId: matchingCustomer ? customerId : undefined,
        productId: matchingProduct ? productId : undefined,
        status: RequestStatus.IP_BLACKLISTED,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'IP address is blacklisted',
          },
        },
        httpStatus: HttpStatus.FORBIDDEN,
      });
    }

    const blacklistedCountries = team.blacklist.filter(
      (b) => b.type === BlacklistType.COUNTRY,
    );
    const blacklistedCountryList = blacklistedCountries.map((b) => b.value);

    if (blacklistedCountryList.length > 0) {
      const geoData = await proxyCheck(ip);

      if (geoData?.isocode) {
        const inIso3 = iso2ToIso3Map[geoData.isocode!];

        if (blacklistedCountryList.includes(inIso3)) {
          await updateBlacklistHits(teamId, BlacklistType.COUNTRY, inIso3);
          return loggedResponse({
            ...loggedResponseBase,
            teamId,
            customerId: matchingCustomer ? customerId : undefined,
            productId: matchingProduct ? productId : undefined,
            status: RequestStatus.COUNTRY_BLACKLISTED,
            response: {
              data: null,
              result: {
                timestamp: new Date(),
                valid: false,
                details: 'Country is blacklisted',
              },
            },
            httpStatus: HttpStatus.FORBIDDEN,
          });
        }
      }
    }

    const blacklistedDeviceIdentifiers = team.blacklist.filter(
      (b) => b.type === BlacklistType.DEVICE_IDENTIFIER,
    );

    const blacklistedDeviceIdentifierList = blacklistedDeviceIdentifiers.map(
      (b) => b.value,
    );

    if (
      deviceIdentifier &&
      blacklistedDeviceIdentifierList.includes(deviceIdentifier)
    ) {
      await updateBlacklistHits(
        teamId,
        BlacklistType.DEVICE_IDENTIFIER,
        deviceIdentifier,
      );
      return loggedResponse({
        ...loggedResponseBase,
        teamId,
        customerId: matchingCustomer ? customerId : undefined,
        productId: matchingProduct ? productId : undefined,
        status: RequestStatus.DEVICE_IDENTIFIER_BLACKLISTED,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'Device identifier is blacklisted',
          },
        },
        httpStatus: HttpStatus.FORBIDDEN,
      });
    }

    const strictModeNoCustomerId =
      hasStrictCustomers && licenseHasCustomers && !customerId;
    const noCustomerMatch =
      licenseHasCustomers && customerId && !matchingCustomer;

    if (strictModeNoCustomerId || noCustomerMatch) {
      return loggedResponse({
        ...loggedResponseBase,
        teamId,
        licenseKeyLookup,
        customerId: matchingCustomer ? customerId : undefined,
        productId: matchingProduct ? productId : undefined,
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

    const strictModeNoProductId =
      hasStrictProducts && licenseHasProducts && !productId;
    const noProductMatch = licenseHasProducts && productId && !matchingProduct;

    if (strictModeNoProductId || noProductMatch) {
      return loggedResponse({
        ...loggedResponseBase,
        teamId,
        licenseKeyLookup,
        customerId: matchingCustomer ? customerId : undefined,
        productId: matchingProduct ? productId : undefined,
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

    if (license.suspended) {
      return loggedResponse({
        ...loggedResponseBase,
        teamId,
        licenseKeyLookup,
        customerId: matchingCustomer ? customerId : undefined,
        productId: matchingProduct ? productId : undefined,
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
        return loggedResponse({
          ...loggedResponseBase,
          teamId,
          licenseKeyLookup,
          customerId: matchingCustomer ? customerId : undefined,
          productId: matchingProduct ? productId : undefined,
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
          return loggedResponse({
            ...loggedResponseBase,
            teamId,
            licenseKeyLookup,
            customerId: matchingCustomer ? customerId : undefined,
            productId: matchingProduct ? productId : undefined,
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

    if (license.ipLimit) {
      const ipAddress = await getIp();
      const existingIps = license.requestLogs.map((log) => log.ipAddress);
      const ipLimitReached = existingIps.length >= license.ipLimit;

      // TODO: @KasperiP: Maybe add separate table for storing IP addresses because user's probably want to also remove old IP addresses
      if (!existingIps.includes(ipAddress) && ipLimitReached) {
        return loggedResponse({
          ...loggedResponseBase,
          teamId,
          licenseKeyLookup,
          customerId: matchingCustomer ? customerId : undefined,
          productId: matchingProduct ? productId : undefined,
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

    if (deviceIdentifier) {
      if (license.seats) {
        const heartbeatTimeout = settings.heartbeatTimeout || 60; // Timeout in minutes

        const activeSeats = license.heartbeats.filter(
          (heartbeat) =>
            new Date(heartbeat.lastBeatAt).getTime() >
            new Date(Date.now() - heartbeatTimeout * 60 * 1000).getTime(),
        );

        const seatsIncludesClient = activeSeats.some(
          (seat) => seat.deviceIdentifier === deviceIdentifier,
        );

        if (!seatsIncludesClient && activeSeats.length >= license.seats) {
          return loggedResponse({
            ...loggedResponseBase,
            teamId,
            licenseKeyLookup,
            customerId: matchingCustomer ? customerId : undefined,
            productId: matchingProduct ? productId : undefined,
            status: RequestStatus.MAXIMUM_CONCURRENT_SEATS,
            response: {
              data: null,
              result: {
                timestamp: new Date(),
                valid: false,
                details: 'License seat limit reached',
              },
            },
            httpStatus: HttpStatus.FORBIDDEN,
          });
        }
      }

      await prisma.heartbeat.upsert({
        where: {
          licenseId_deviceIdentifier: {
            licenseId: license.id,
            deviceIdentifier,
          },
        },
        update: {
          lastBeatAt: new Date(),
          ipAddress: await getIp(),
        },
        create: {
          teamId,
          deviceIdentifier,
          lastBeatAt: new Date(),
          licenseId: license.id,
        },
      });
    }

    const privateKey = team.keyPair?.privateKey!;

    const challengeResponse = challenge
      ? signChallenge(challenge, privateKey)
      : undefined;

    return loggedResponse({
      ...loggedResponseBase,
      teamId,
      licenseKeyLookup,
      customerId: matchingCustomer ? customerId : undefined,
      productId: matchingProduct ? productId : undefined,
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
    logger.error(
      "Error occurred in '(external)/v1/license/[slug]/verify' route",
      error,
    );

    if (error instanceof SyntaxError) {
      return loggedResponse({
        ...loggedResponseBase,
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

    return loggedResponse({
      ...loggedResponseBase,
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

async function updateBlacklistHits(
  teamId: string,
  type: BlacklistType,
  value: string,
) {
  await prisma.blacklist.update({
    where: {
      teamId_type_value: {
        teamId,
        type,
        value,
      },
    },
    data: {
      hits: {
        increment: 1,
      },
    },
  });
}
