import { regex } from '@/lib/constants/regex';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { generateKeyPair } from '@/lib/utils/crypto';
import { getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ITeamsResetPublicKeySuccessResponse = {
  publicKeyRsa: string;
};

export type ITeamsResetPublicKeyResponse =
  | ErrorResponse
  | ITeamsResetPublicKeySuccessResponse;

export async function POST(
  request: NextRequest,
  { params }: { params: { slug: string } },
) {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const teamId = params.slug;

    if (!teamId || !regex.uuidV4.test(teamId)) {
      return NextResponse.json(
        {
          message: t('validation.bad_request'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const session = await getSession({
      user: {
        include: {
          teams: {
            where: {
              id: teamId,
              deletedAt: null,
            },
            omit: {
              publicKeyRsa: false,
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

    const { privateKey, publicKey } = generateKeyPair();

    await prisma.team.update({
      where: {
        id: teamId,
      },
      data: {
        publicKeyRsa: publicKey,
        privateKeyRsa: privateKey,
      },
      omit: {
        publicKeyRsa: false,
      },
    });

    return NextResponse.json(
      {
        publicKeyRsa: publicKey,
      },
      { status: HttpStatus.OK },
    );
  } catch (error) {
    logger.error(
      "Error occurred in 'teams/[slug]/reset-public-key' route",
      error,
    );
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
