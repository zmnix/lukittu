import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import {
  setProductSchema,
  SetProductSchema,
} from '@/lib/validation/products/set-product-schema';
import { ErrorResponse } from '@/types/common-api-types';
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

export type ProductPostResponse =
  | ErrorResponse
  | {
      product: Product;
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

  if (!session) {
    return NextResponse.json(
      {
        error: t('validation.unauthorized'),
      },
      { status: 401 },
    );
  }

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

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ProductPostResponse>> {
  const body = (await request.json()) as SetProductSchema;

  const t = await getTranslations({ locale: getLanguage() });
  const validated = await setProductSchema(t).safeParseAsync(body);

  if (!validated.success) {
    return NextResponse.json(
      {
        field: validated.error.errors[0].path[0],
        message: validated.error.errors[0].message,
      },
      { status: 400 },
    );
  }

  const { name, url, description } = validated.data;

  const selectedTeam = getSelectedTeam();

  if (!selectedTeam) {
    return NextResponse.json(
      {
        message: t('validation.team_not_found'),
      },
      { status: 404 },
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
            products: {
              where: {
                deletedAt: null,
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
      { status: 401 },
    );
  }

  if (!session.user.teams.length) {
    return NextResponse.json(
      {
        message: t('validation.team_not_found'),
      },
      { status: 404 },
    );
  }

  const team = session.user.teams[0];

  if (!team) {
    return NextResponse.json(
      {
        message: t('validation.team_not_found'),
      },
      { status: 404 },
    );
  }

  if (team.products.find((product) => product.name === name)) {
    return NextResponse.json(
      {
        message: t('validation.product_already_exists'),
      },
      { status: 400 },
    );
  }

  const product = await prisma.product.create({
    data: {
      name: name,
      url: url || null,
      description: description || null,
      team: {
        connect: {
          id: selectedTeam,
        },
      },
    },
  });

  return NextResponse.json({
    product,
  });
}
