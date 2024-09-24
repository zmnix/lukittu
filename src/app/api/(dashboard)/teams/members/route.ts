import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getGravatarUrl } from '@/lib/utils/gravatar';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { User } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

type ITeamsMembersSuccessResponse = {
  members: (Omit<User, 'passwordHash'> & {
    avatarUrl: string | null;
    isOwner: boolean;
  })[];
};

export type ITeamsMembersResponse =
  | ErrorResponse
  | ITeamsMembersSuccessResponse;

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ITeamsMembersResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const searchParams = request.nextUrl.searchParams;
    const selectedTeam = getSelectedTeam();

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

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              deletedAt: null,
              id: selectedTeam,
            },
            include: {
              users: {
                where: {
                  OR: search
                    ? [
                        {
                          email: {
                            contains: search,
                            mode: 'insensitive',
                          },
                        },
                        {
                          fullName: {
                            contains: search,
                            mode: 'insensitive',
                          },
                        },
                      ]
                    : undefined,
                },
                orderBy: {
                  [sortColumn]: sortDirection,
                },
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

    const totalMembers = await prisma.user.count({
      where: {
        teams: {
          some: {
            id: selectedTeam,
          },
        },
      },
    });

    const members = session.user.teams[0].users.map((user) => ({
      ...user,
      avatarUrl: getGravatarUrl(user.email),
      isOwner: user.id === session.user.teams[0].ownerId,
    }));

    return NextResponse.json({
      members,
      totalMembers,
    });
  } catch (error) {
    logger.error("Error occurred in 'teams/members' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
