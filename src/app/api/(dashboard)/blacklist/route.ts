import { iso2ToIso3Map } from '@/lib/constants/country-alpha-2-to-3';
import { iso3ToName } from '@/lib/constants/country-alpha-3-to-name';
import prisma from '@/lib/database/prisma';
import { createAuditLog } from '@/lib/logging/audit-log';
import { logger } from '@/lib/logging/logger';
import { getSession } from '@/lib/security/session';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import {
  setBlacklistSchema,
  SetBlacklistSchema,
} from '@/lib/validation/blacklist/set-blacklist-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import {
  AuditLogAction,
  AuditLogTargetType,
  Blacklist,
  Prisma,
} from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type IBlacklistGetSuccessResponse = {
  blacklist: (Blacklist & {
    alpha2: string | null;
    country: string | null;
  })[];
  totalResults: number;
  hasResults: boolean;
};

export type IBlacklistGetResponse =
  | ErrorResponse
  | IBlacklistGetSuccessResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<IBlacklistGetResponse>> {
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
    const allowedSortColumns = ['createdAt', 'updatedAt'];

    const search = (searchParams.get('search') as string) || '';

    let page = parseInt(searchParams.get('page') as string) || 1;
    let pageSize = parseInt(searchParams.get('pageSize') as string) || 10;
    let sortColumn = searchParams.get('sortColumn') as string;
    let sortDirection = searchParams.get('sortDirection') as 'asc' | 'desc';

    if (!allowedSortDirections.includes(sortDirection)) {
      sortDirection = 'desc';
    }

    if (!sortColumn || !allowedSortColumns.includes(sortColumn)) {
      sortColumn = 'createdAt';
    }

    if (!allowedPageSizes.includes(pageSize)) {
      pageSize = 25;
    }

    if (page < 1) {
      page = 1;
    }

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    let additionalCountrySearch: string | undefined;
    const lowercaseSearch = search.toLowerCase();

    const lowercaseCountryMap = Object.entries(iso3ToName).reduce(
      (acc, [iso3, name]) => {
        acc[name.toLowerCase()] = iso3;
        return acc;
      },
      {} as Record<string, string>,
    );

    const matchingCountry = Object.keys(lowercaseCountryMap).find((name) =>
      name.includes(lowercaseSearch),
    );

    if (matchingCountry) {
      additionalCountrySearch = lowercaseCountryMap[matchingCountry];
    }

    const whereWithoutTeamCheck = (
      search && additionalCountrySearch
        ? {
            OR: [
              {
                value: search
                  ? { contains: search, mode: 'insensitive' }
                  : undefined,
              },
              {
                value: additionalCountrySearch
                  ? { equals: additionalCountrySearch }
                  : undefined,
              },
            ],
          }
        : {
            value: search
              ? { contains: search, mode: 'insensitive' }
              : undefined,
          }
    ) as Prisma.BlacklistWhereInput;

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              blacklist: {
                where: whereWithoutTeamCheck,
                skip,
                take,
                orderBy: {
                  [sortColumn]: sortDirection,
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

    const [hasResults, totalResults] = await prisma.$transaction([
      prisma.blacklist.findFirst({
        where: {
          teamId: selectedTeam,
        },
        select: {
          id: true,
        },
      }),
      prisma.blacklist.count({
        where: {
          ...whereWithoutTeamCheck,
          teamId: selectedTeam,
        },
      }),
    ]);
    const blacklist = session.user.teams[0].blacklist;

    return NextResponse.json({
      blacklist: blacklist.map((blacklist) => ({
        ...blacklist,
        alpha2:
          blacklist.type === 'COUNTRY'
            ? (Object.keys(iso2ToIso3Map).find(
                (key) => iso2ToIso3Map[key] === blacklist.value,
              ) ?? null)
            : null,
        country:
          blacklist.type === 'COUNTRY' ? iso3ToName[blacklist.value] : null,
      })),
      totalResults,
      hasResults: Boolean(hasResults),
    });
  } catch (error) {
    logger.error("Error occurred in 'blacklist' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

type IBlacklistCreateSuccessResponse = {
  blacklist: Blacklist;
};

export type IBlacklistCreateResponse =
  | ErrorResponse
  | IBlacklistCreateSuccessResponse;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<IBlacklistCreateResponse>> {
  const t = await getTranslations({ locale: await getLanguage() });

  try {
    const body = (await request.json()) as SetBlacklistSchema;
    const validated = await setBlacklistSchema(t).safeParseAsync(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          field: validated.error.errors[0].path[0],
          message: validated.error.errors[0].message,
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const { type, value, metadata } = validated.data;

    const selectedTeam = await getSelectedTeam();

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
              blacklist: true,
              limits: true,
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

    const team = session.user.teams[0];

    if (!team.limits) {
      // Should never happen
      return NextResponse.json(
        {
          message: t('general.server_error'),
        },
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (team.blacklist.length >= team.limits.maxBlacklist) {
      return NextResponse.json(
        {
          message: t('validation.max_blacklist_reached'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (
      team.blacklist.find(
        (blacklist) => blacklist.value === value && blacklist.type === type,
      )
    ) {
      return NextResponse.json(
        {
          message: t('validation.blacklist_exists'),
          field: 'value',
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const blacklist = await prisma.blacklist.create({
      data: {
        value,
        type,
        metadata,
        createdBy: {
          connect: {
            id: session.user.id,
          },
        },
        team: {
          connect: {
            id: selectedTeam,
          },
        },
      },
    });

    const response = {
      blacklist,
    };

    createAuditLog({
      userId: session.user.id,
      teamId: team.id,
      action: AuditLogAction.CREATE_BLACKLIST,
      targetId: blacklist.id,
      targetType: AuditLogTargetType.BLACKLIST,
      requestBody: body,
      responseBody: response,
    });

    return NextResponse.json(response);
  } catch (error) {
    logger.error("Error occurred in 'blacklist' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
