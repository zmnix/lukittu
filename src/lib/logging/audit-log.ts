import { AuditLogAction, AuditLogTargetType } from '@prisma/client';
import 'server-only';
import prisma from '../database/prisma';
import { getCloudflareVisitorData } from '../providers/cloudflare';
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
  const geoData = await getCloudflareVisitorData();
  const longitude = geoData?.long || null;
  const latitude = geoData?.lat || null;
  const hasBothLongitudeAndLatitude = longitude && latitude;
  const countryAlpha3: string | null = geoData?.alpha2
    ? iso2toIso3(geoData.alpha2!)
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
