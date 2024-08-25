import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

type ProductDeleteRequest = {
  productNameConfirmation: string;
};

type IDeleteProductSuccessResponse = {
  success: boolean;
};

export type IDeleteProductResponse =
  | ErrorResponse
  | IDeleteProductSuccessResponse;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } },
): Promise<NextResponse<IDeleteProductResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const body = await request.json();
    const { productNameConfirmation } = body as ProductDeleteRequest;
    const productId = parseInt(params.slug);

    if (isNaN(productId) || productId <= 0) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const selectedTeam = getSelectedTeam();

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
        { status: HttpStatus.BAD_REQUEST },
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
        { status: HttpStatus.NOT_FOUND },
      );
    }

    if (productNameConfirmation !== product.name.toUpperCase()) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
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
  } catch (error) {
    logger.error("Error occurred in 'products/[slug]' route:", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
