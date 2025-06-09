import { getSession } from '@/lib/security/session';
import { iso3toIso2, iso3ToName } from '@/lib/utils/country-helpers';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import {
  AuditLog,
  AuditLogSource,
  AuditLogTargetType,
  logger,
  prisma,
  Prisma,
  User,
} from '@lukittu/shared';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';
import { UAParser } from 'ua-parser-js';
import { z } from 'zod';

export type IAuditLogsGetSuccessResponse = {
  auditLogs: (AuditLog & {
    user: Omit<User, 'passwordHash'> | null;
    alpha2: string | null;
    alpha3: string | null;
    country: string | null;
    browser: string | null;
    os: string | null;
    device: string | null;
  })[];
  totalResults: number;
};

export type IAuditLogsGetResponse =
  | ErrorResponse
  | IAuditLogsGetSuccessResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<IAuditLogsGetResponse>> {
  const t = await getTranslations({ locale: await getLanguage() });

  try {
    const searchParams = request.nextUrl.searchParams;
    const selectedTeam = await getSelectedTeam();

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
    const allowedSortColumns = ['createdAt'];

    const ipSearch = (searchParams.get('ipSearch') as string) || '';
    const sourceFilter = (searchParams.get('source') as string) || '';
    const targetTypeFilter = (searchParams.get('targetType') as string) || '';
    const rangeStart = searchParams.get('rangeStart') as string;
    const rangeEnd = searchParams.get('rangeEnd') as string;

    let page = parseInt(searchParams.get('page') as string) || 1;
    let pageSize = parseInt(searchParams.get('pageSize') as string) || 10;
    let sortColumn = searchParams.get('sortColumn') as string;
    let sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc';

    const invalidRangeStart = z.coerce
      .date()
      .safeParse(new Date(rangeStart)).error;
    const invalidRangeEnd = z.coerce.date().safeParse(new Date(rangeEnd)).error;

    if ((rangeStart && invalidRangeStart) || (rangeEnd && invalidRangeEnd)) {
      return NextResponse.json(
        { message: t('validation.bad_request') },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (!allowedSortDirections.includes(sortDirection)) {
      sortDirection = 'desc';
    }

    if (!sortColumn || !allowedSortColumns.includes(sortColumn)) {
      sortColumn = 'createdAt';
    }

    const allowedTargetTypes = Object.values(AuditLogTargetType)
      .map((type) => type.toLowerCase())
      .concat(['all']);

    if (
      targetTypeFilter &&
      !allowedTargetTypes.includes(targetTypeFilter.toLowerCase())
    ) {
      return NextResponse.json(
        { message: t('validation.bad_request') },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const allocatedSourceValues = Object.values(AuditLogSource)
      .map((source) => source.toLowerCase())
      .concat(['all']);

    if (ipSearch && typeof ipSearch !== 'string') {
      return NextResponse.json(
        { message: t('validation.bad_request') },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (
      sourceFilter &&
      !allocatedSourceValues.includes(sourceFilter.toLowerCase())
    ) {
      return NextResponse.json(
        { message: t('validation.bad_request') },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (
      sourceFilter &&
      !allocatedSourceValues.includes(sourceFilter.toLowerCase())
    ) {
      return NextResponse.json(
        { message: t('validation.bad_request') },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (!allowedPageSizes.includes(pageSize)) {
      pageSize = 25;
    }

    if (page < 1) {
      page = 1;
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const team = await prisma.team.findUnique({
      where: {
        id: selectedTeam,
        deletedAt: null,
      },
      include: {
        limits: true,
      },
    });

    if (!team) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    const DAYS_IN_MONTH = 30;
    const SIX_MONTHS_IN_DAYS = 6 * DAYS_IN_MONTH;

    const teamLogRetentionDays =
      team.limits?.logRetention ?? SIX_MONTHS_IN_DAYS;

    const furthestAllowedDate = new Date();
    furthestAllowedDate.setDate(
      furthestAllowedDate.getDate() - teamLogRetentionDays,
    );

    let rangeStartToUse = furthestAllowedDate;
    if (rangeStart && new Date(rangeStart) > furthestAllowedDate) {
      rangeStartToUse = new Date(rangeStart);
    }

    const where = {
      teamId: selectedTeam,
      createdAt: {
        gte: rangeStartToUse,
        lte: rangeEnd ? new Date(rangeEnd) : new Date(),
      },
      source: sourceFilter ? sourceFilter : undefined,
      targetType: targetTypeFilter ? targetTypeFilter : undefined,
      ipAddress: ipSearch ? { contains: ipSearch } : undefined,
    } as Prisma.AuditLogWhereInput;

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              auditLogs: {
                where,
                include: {
                  user: true,
                },
                orderBy: [
                  {
                    [sortColumn]: sortDirection,
                  },
                ],
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

    const totalResults = await prisma.auditLog.count({
      where,
    });

    const auditlog = session.user.teams[0].auditLogs;

    const requestLogsWithCountries = auditlog.map((log) => {
      let browser: string | null = null;
      let os: string | null = null;
      let device: string | null = null;

      if (log.userAgent) {
        const parser = new UAParser(log.userAgent);
        const browserObj = parser.getBrowser();
        const osObj = parser.getOS();
        const deviceObj = parser.getDevice();

        browser = browserObj.name
          ? `${browserObj.name} ${browserObj.version ?? ''}`
          : null;
        os = osObj.name ? `${osObj.name} ${osObj.version ?? ''}` : null;
        device = deviceObj.type ?? null;
      }

      return {
        ...log,
        country: iso3ToName(log.country),
        alpha3: log.country ?? null,
        alpha2: iso3toIso2(log.country),
        browser,
        os,
        device,
        user: log.user,
      };
    });

    return NextResponse.json({
      auditLogs: requestLogsWithCountries,
      totalResults,
    });
  } catch (error) {
    logger.error("Error occurred in 'auditlogs' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
