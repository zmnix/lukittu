import { AuditLogAction, AuditLogTargetType } from '@prisma/client';
import 'server-only';
import { iso2ToIso3Map } from '../constants/country-alpha-2-to-3';
import prisma from '../database/prisma';
import { getIp, getUserAgent } from './header-helpers';
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
  const ipAddress = getIp();
  const userAgent = getUserAgent();
  const geoData = await fetch(`http://ip-api.com/json/${ipAddress}`);
  const geoDataJson = geoData.ok ? await geoData.json() : null;
  const longitude = geoDataJson?.lon || null;
  const latitude = geoDataJson?.lat || null;
  const hasBothLongitudeAndLatitude = longitude && latitude;
  const countryAlpha3: string | null = geoDataJson?.countryCode
    ? iso2ToIso3Map[geoDataJson.countryCode]
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
