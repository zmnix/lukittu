import prisma from '@/lib/database/prisma';
import { createAuditLog } from '@/lib/utils/audit-log';
import { getSession } from '@/lib/utils/auth';
import { generateKeyPair } from '@/lib/utils/crypto';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { AuditLogAction, AuditLogTargetType } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ITeamsResetPublicKeySuccessResponse = {
  publicKey: string;
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
              id: selectedTeam,
              deletedAt: null,
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

    await prisma.keyPair.update({
      where: {
        teamId: selectedTeam,
      },
      data: {
        publicKey,
        privateKey,
      },
    });

    const response = {
      publicKey,
    };

    createAuditLog({
      userId: session.user.id,
      teamId: selectedTeam,
      action: AuditLogAction.RESET_PUBLIC_KEY,
      targetId: selectedTeam,
      targetType: AuditLogTargetType.TEAM,
      responseBody: response,
    });

    return NextResponse.json(response, { status: HttpStatus.OK });
  } catch (error) {
    logger.error("Error occurred in 'teams/reset-public-key' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
