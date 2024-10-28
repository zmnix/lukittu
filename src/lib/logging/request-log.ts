import { HttpStatus } from '@/types/http-status';
import { RequestMethod, RequestStatus } from '@prisma/client';
import { NextRequest, NextResponse } from 'next/server';
import 'server-only';
import prisma from '../database/prisma';
import { proxyCheck } from '../providers/proxycheck';
import { iso2toIso3 } from '../utils/country-helpers';
import { getIp, getOrigin, getUserAgent } from '../utils/header-helpers';
import { logger } from './logger';

interface LogRequestProps {
  pathname: string;
  requestBody: any;
  responseBody: any;
  requestTime: Date;
  statusCode: number;
  status: RequestStatus;
  customerId?: string;
  productId?: string;
  licenseKeyLookup?: string;
  teamId?: string;
  method: string;
}

export async function logRequest({
  requestBody,
  responseBody,
  requestTime,
  status,
  statusCode,
  customerId,
  productId,
  licenseKeyLookup,
  teamId,
  method,
  pathname,
}: LogRequestProps) {
  try {
    const origin = await getOrigin();
    const ipAddress = await getIp();
    const geoData = await proxyCheck(ipAddress);
    const longitude = geoData?.longitude || null;
    const latitude = geoData?.latitude || null;
    const hasBothLongitudeAndLatitude = longitude && latitude;
    const countryAlpha3: string | null = geoData?.isocode
      ? iso2toIso3(geoData.isocode!)
      : null;

    await prisma.requestLog.create({
      data: {
        version: process.env.version!,
        method: method.toUpperCase() as RequestMethod,
        path: pathname,
        userAgent: await getUserAgent(),
        origin,
        statusCode,
        longitude: hasBothLongitudeAndLatitude ? longitude : null,
        latitude: hasBothLongitudeAndLatitude ? latitude : null,
        responseTime: new Date().getTime() - requestTime.getTime(),
        status,
        requestBody,
        responseBody,
        ipAddress,
        country: countryAlpha3,
        team: { connect: { id: teamId } },
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

interface HandleLoggedRequestResponse {
  body: any;
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

export interface ExternalVerifyResponse {
  data: any;
  result: {
    timestamp: Date;
    valid: boolean;
    details: string;
    code: RequestStatus;
    challengeResponse?: string;
  };
}

export async function loggedResponse({
  body,
  request,
  requestTime,
  status,
  teamId,
  response,
  httpStatus,
  customerId,
  productId,
  licenseKeyLookup,
}: HandleLoggedRequestResponse): Promise<NextResponse<ExternalVerifyResponse>> {
  const responseBody = {
    data: response.data,
    result: {
      timestamp: response.result.timestamp,
      valid: response.result.valid,
      details: response.result.details,
      code: status,
      challengeResponse: response.result.challengeResponse,
    },
  };

  if (teamId) {
    logRequest({
      pathname: request.nextUrl.pathname,
      requestBody: body,
      responseBody,
      requestTime,
      status,
      customerId,
      productId,
      licenseKeyLookup,
      teamId,
      statusCode: httpStatus,
      method: request.method,
    });
  }

  return NextResponse.json(responseBody, { status: httpStatus });
}
