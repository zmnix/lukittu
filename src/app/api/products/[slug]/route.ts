import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export interface ProductDeleteRequest {
  productNameConfirmation: string;
}

export type ProductDeleteResponse =
  | ErrorResponse
  | {
      success: boolean;
    };

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<ProductDeleteResponse>> {
  const t = await getTranslations({ locale: getLanguage() });
  const body = await request.json();

  const { productNameConfirmation } = body as ProductDeleteRequest;
  const productId = parseInt(params.slug);

  if (isNaN(productId) || productId <= 0) {
    return NextResponse.json(
      {
        message: t('validation.bad_request'),
      },
      { status: 400 },
    );
  }

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

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      teamId: selectedTeam,
      deletedAt: null,
    },
  });

  if (!product) {
    return NextResponse.json(
      {
        message: t('validation.product_not_found'),
      },
      { status: 404 },
    );
  }

  if (productNameConfirmation !== product.name.toUpperCase()) {
    return NextResponse.json(
      {
        message: t('validation.bad_request'),
      },
      { status: 400 },
    );
  }

  await prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return NextResponse.json({
    success: true,
  });
}
