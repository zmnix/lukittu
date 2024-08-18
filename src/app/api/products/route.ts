import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { Product } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ProductsGetResponse =
  | {
      products: Product[];
      totalProducts: number;
    }
  | {
      error: string;
    };

export async function GET(
  request: NextRequest,
): Promise<NextResponse<ProductsGetResponse>> {
  const searchParams = request.nextUrl.searchParams;
  const t = await getTranslations({ locale: getLanguage() });
  const selectedTeam = getSelectedTeam();

  if (!selectedTeam) {
    return NextResponse.json(
      {
        error: t('validation.team_not_found'),
      },
      { status: 404 },
    );
  }

  const allowedPageSizes = [25, 50, 100];
  const allowedSortDirections = ['asc', 'desc'];
  const allowedSortColumns = ['name', 'createdAt'];

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
            products: {
              where: {
                deletedAt: null,
                name: search
                  ? {
                      contains: search,
                      mode: 'insensitive',
                    }
                  : undefined,
              },
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

  if (!session.user.teams.length) {
    return NextResponse.json(
      {
        error: t('validation.team_not_found'),
      },
      { status: 404 },
    );
  }

  const totalProducts = await prisma.product.count({
    where: {
      teamId: selectedTeam,
    },
  });

  const products = session.user.teams[0].products;

  return NextResponse.json({
    products,
    totalProducts,
  });
}
