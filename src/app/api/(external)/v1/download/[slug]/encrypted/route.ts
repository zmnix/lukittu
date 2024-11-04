import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { logger } from '@/lib/logging/logger';
import {
  ExternalVerifyResponse,
  loggedResponse,
} from '@/lib/logging/request-log';
import { getFileFromPrivateS3 } from '@/lib/providers/aws-s3';
import { getCloudflareVisitorData } from '@/lib/providers/cloudflare';
import {
  createEncryptionStream,
  generateHMAC,
  privateDecrypt,
} from '@/lib/security/crypto';
import { isRateLimited } from '@/lib/security/rate-limiter';
import { iso2toIso3 } from '@/lib/utils/country-helpers';
import { getIp } from '@/lib/utils/header-helpers';
import { downloadReleaseSchema } from '@/lib/validation/products/download-release-schema';
import { HttpStatus } from '@/types/http-status';
import { BlacklistType, IpLimitPeriod, RequestStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ slug: string }> },
): Promise<NextResponse<ExternalVerifyResponse> | Response> {
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

    const searchParams = request.nextUrl.searchParams;
    const payload = {
      licenseKey: searchParams.get('licenseKey') || undefined,
      customerId: searchParams.get('customerId') || undefined,
      productId: searchParams.get('productId') || undefined,
      version: searchParams.get('version') || undefined,
      sessionKey: searchParams.get('sessionKey') || undefined,
      deviceIdentifier: searchParams.get('deviceIdentifier') || undefined,
    };
    const validated = await downloadReleaseSchema().safeParseAsync(payload);

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

    const ipAddress = await getIp();

    // TODO: Enable rate limiting
    if (ipAddress) {
      const key = `license-encrypted:${ipAddress}`;
      const isLimited = await isRateLimited(key, 5, 60); // 5 requests per 1 minute

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
        settings: true,
        blacklist: true,
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

    const {
      licenseKey,
      deviceIdentifier,
      customerId,
      productId,
      version,
      sessionKey,
    } = validated.data;

    const privateKey = team.keyPair?.privateKey!;

    const getSessionKey = async () => {
      try {
        const decryptedBuffer = await privateDecrypt(sessionKey, privateKey);
        return Buffer.from(decryptedBuffer).toString('hex');
      } catch (error) {
        logger.error(
          'Error occurred while decrypting session key in download route',
          error,
        );
        return null;
      }
    };

    const validatedSessionKey = await getSessionKey();

    if (!validatedSessionKey) {
      return loggedResponse({
        ...loggedResponseBase,
        teamId,
        status: RequestStatus.INVALID_SESSION_KEY,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'Invalid session key',
          },
        },
        httpStatus: HttpStatus.BAD_REQUEST,
      });
    }

    const validatedSessionKeyHash = generateHMAC(validatedSessionKey);
    const sessionKeyRatelimitKey = `session-key:${teamId}:${validatedSessionKeyHash}`;

    const isSessionKeyLimited = await isRateLimited(
      sessionKeyRatelimitKey,
      1,
      900,
    ); // 1 request per 15 minutes

    if (isSessionKeyLimited) {
      return loggedResponse({
        ...loggedResponseBase,
        teamId,
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
        products: {
          where: {
            id: productId,
          },
          include: {
            releases: {
              where: {
                file: {
                  isNot: null,
                },
              },
              include: {
                file: true,
              },
            },
          },
        },
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

    const hasStrictCustomers = settings.strictCustomers || false;

    const matchingCustomer = license?.customers.find(
      (customer) => customer.id === customerId,
    );

    const matchingProduct = license?.products.find(
      (product) => product.id === productId,
    );

    const commonBase = {
      teamId,
      customerId: matchingCustomer ? customerId : undefined,
      productId: matchingProduct ? productId : undefined,
      deviceIdentifier,
      licenseKeyLookup: undefined as string | undefined,
    };

    if (!license) {
      return loggedResponse({
        ...loggedResponseBase,
        ...commonBase,
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

    commonBase.licenseKeyLookup = licenseKeyLookup;

    if (!matchingProduct) {
      return loggedResponse({
        ...loggedResponseBase,
        ...commonBase,
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

    const versionMatchRelease = matchingProduct.releases.find(
      (v) => v.version === version,
    );
    if (version) {
      if (!versionMatchRelease) {
        return loggedResponse({
          ...loggedResponseBase,
          ...commonBase,
          status: RequestStatus.RELEASE_NOT_FOUND,
          response: {
            data: null,
            result: {
              timestamp: new Date(),
              valid: false,
              details: 'Release not found',
            },
          },
          httpStatus: HttpStatus.NOT_FOUND,
        });
      }
    }

    const latestRelease = matchingProduct.releases.find(
      (release) => release.latest,
    );

    // Should never happen
    if (!latestRelease) {
      return loggedResponse({
        ...loggedResponseBase,
        ...commonBase,
        status: RequestStatus.RELEASE_NOT_FOUND,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'Latest release not found',
          },
        },
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    const releaseToUse = version ? versionMatchRelease : latestRelease;
    const fileToUse = version ? versionMatchRelease?.file : latestRelease.file;

    // Should never happen
    if (!fileToUse) {
      return loggedResponse({
        ...loggedResponseBase,
        ...commonBase,
        status: RequestStatus.RELEASE_NOT_FOUND,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'File not found',
          },
        },
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    const blacklistedIps = team.blacklist.filter(
      (b) => b.type === BlacklistType.IP_ADDRESS,
    );
    const blacklistedIpList = blacklistedIps.map((b) => b.value);

    if (ipAddress && blacklistedIpList.includes(ipAddress)) {
      await updateBlacklistHits(teamId, BlacklistType.IP_ADDRESS, ipAddress);
      return loggedResponse({
        ...loggedResponseBase,
        ...commonBase,
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
      const geoData = await getCloudflareVisitorData();

      if (geoData?.alpha2) {
        const inIso3 = iso2toIso3(geoData.alpha2!)!;

        if (blacklistedCountryList.includes(inIso3)) {
          await updateBlacklistHits(teamId, BlacklistType.COUNTRY, inIso3);
          return loggedResponse({
            ...loggedResponseBase,
            ...commonBase,
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
        ...commonBase,
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
        ...commonBase,
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

    if (license.suspended) {
      return loggedResponse({
        ...loggedResponseBase,
        ...commonBase,
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
          ...commonBase,
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
            ...commonBase,
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
      const existingIps = license.requestLogs.map((log) => log.ipAddress);
      const ipLimitReached = existingIps.length >= license.ipLimit;

      // TODO: @KasperiP: Maybe add separate table for storing IP addresses because user's probably want to also remove old IP addresses
      if (!existingIps.includes(ipAddress) && ipLimitReached) {
        return loggedResponse({
          ...loggedResponseBase,
          ...commonBase,
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

    if (license.seats) {
      const heartbeatTimeout = settings.heartbeatTimeout || 60;

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
          ...commonBase,
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
        ipAddress,
      },
      create: {
        ipAddress,
        teamId: team.id,
        deviceIdentifier,
        lastBeatAt: new Date(),
        licenseId: license.id,
      },
    });

    const file = await getFileFromPrivateS3(
      process.env.PRIVATE_OBJECT_STORAGE_BUCKET_NAME!,
      fileToUse.key,
    );

    if (!file) {
      return loggedResponse({
        ...loggedResponseBase,
        ...commonBase,
        status: RequestStatus.RELEASE_NOT_FOUND,
        response: {
          data: null,
          result: {
            timestamp: new Date(),
            valid: false,
            details: 'File not found',
          },
        },
        httpStatus: HttpStatus.NOT_FOUND,
      });
    }

    const fileStream = file.Body?.transformToWebStream();

    if (!fileStream) {
      return loggedResponse({
        ...loggedResponseBase,
        ...commonBase,
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

    const encryptedStream = fileStream.pipeThrough(
      createEncryptionStream(validatedSessionKey),
    );

    return new Response(encryptedStream, {
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Security-Policy': "default-src 'none'",
        'X-Content-Type-Options': 'nosniff',
        'X-File-Size': fileToUse.size.toString(),
        'X-Product-Name': matchingProduct.name,
        ...(releaseToUse?.version ? { 'X-Version': releaseToUse.version } : {}),
        ...(process.env.version
          ? { 'X-Lukittu-Version': process.env.version }
          : {}),
        ...(fileToUse.mainClassName
          ? {
              'X-Main-Class': fileToUse.mainClassName,
            }
          : {}),
      },
    });
  } catch (error) {
    logger.error(
      "Error occurred in '(external)/v1/license/[slug]/heartbeat' route",
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
