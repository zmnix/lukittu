import { AuditLogAction, AuditLogTargetType } from '@prisma/client';
import 'server-only';
import prisma from '../database/prisma';
import { proxyCheck } from '../providers/proxycheck';
import { iso2toIso3 } from '../utils/country-helpers';
import { getIp, getUserAgent } from '../utils/header-helpers';
import { logger } from './logger';

interface CreateAuditLogProps {
  userId: string;
  teamId: string;
  action: AuditLogAction;
  targetId: string;
  targetType: AuditLogTargetType;
  requestBody?: any;
  responseBody?: any;
}

export const createAuditLog = async ({
  userId,
  teamId,
  action,
  targetId,
  targetType,
  requestBody,
  responseBody,
}: CreateAuditLogProps) => {
  const ipAddress = await getIp();
  const userAgent = await getUserAgent();
  const geoData = await proxyCheck(ipAddress);
  const longitude = geoData?.longitude || null;
  const latitude = geoData?.latitude || null;
  const hasBothLongitudeAndLatitude = longitude && latitude;
  const countryAlpha3: string | null = geoData?.isocode
    ? iso2toIso3(geoData.isocode!)
    : null;

  try {
    await prisma.auditLog.create({
      data: {
        version: process.env.version!,
        teamId,
        ipAddress,
        latitude: hasBothLongitudeAndLatitude ? latitude : null,
        longitude: hasBothLongitudeAndLatitude ? longitude : null,
        userAgent,
        action,
        targetId,
        targetType,
        requestBody,
        responseBody,
        userId,
        country: countryAlpha3,
      },
    });
  } catch (error: any) {
    logger.error('Failed to create audit log', error);
  }
};
