import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { generateHMAC } from '@/lib/utils/crypto';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';

type ILicensesGenerateSuccessResponse = {
  licenseKey: string;
};

export type ILicensesGenerateResponse =
  | ErrorResponse
  | ILicensesGenerateSuccessResponse;

export async function GET(): Promise<NextResponse<ILicensesGenerateResponse>> {
  const t = await getTranslations({ locale: await getLanguage() });

  try {
    const selectedTeam = await getSelectedTeam();

    if (!selectedTeam) {
      return NextResponse.json(
        {
          message: t('validation.team_not_found'),
        },
        { status: HttpStatus.BAD_REQUEST },
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

    const licenseKey = await findUniqueLicenseKey(selectedTeam);

    if (!licenseKey) {
      return NextResponse.json(
        {
          message: t('general.server_error'),
        },
        { status: HttpStatus.INTERNAL_SERVER_ERROR },
      );
    }

    return NextResponse.json({ licenseKey });
  } catch (error) {
    logger.error("Error occurred in 'licenses/generate' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}

const generateRandomString = (length: number): string => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters[randomIndex];
  }

  return result;
};

const formatLicenseKey = (key: string): string =>
  key.match(/.{1,5}/g)!.join('-');

const generateLicenseKey = (): string => {
  const rawKey = generateRandomString(25);
  return formatLicenseKey(rawKey);
};

const findUniqueLicenseKey = async (
  selectedTeamId: string,
): Promise<string | null> => {
  const MAX_ATTEMPTS = 5;
  let attempts = 0;

  while (attempts < MAX_ATTEMPTS) {
    const licenseKey = generateLicenseKey();
    const hmac = generateHMAC(`${licenseKey}:${selectedTeamId}`);

    const license = await prisma.license.findUnique({
      where: {
        teamId_licenseKeyLookup: {
          teamId: selectedTeamId,
          licenseKeyLookup: hmac,
        },
      },
    });

    if (!license) {
      return licenseKey;
    }

    attempts++;
  }

  return null;
};
