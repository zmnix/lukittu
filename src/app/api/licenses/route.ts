import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { ErrorResponse } from '@/types/common-api-types';
import { getTranslations } from 'next-intl/server';
import { NextResponse } from 'next/server';

export type LicenseKeyResponse =
  | ErrorResponse
  | {
      licenseKey: string;
    };

export async function GET(): Promise<NextResponse<LicenseKeyResponse>> {
  const t = await getTranslations({ locale: getLanguage() });
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

  const findUniqueLicenseKey = async (): Promise<string> => {
    const MAX_ATTEMPTS = 10;
    let attempts = 0;

    while (attempts < MAX_ATTEMPTS) {
      let licenseKey = generateLicenseKey();

      const license = await prisma.license.findFirst({
        where: {
          licenseKey,
          teamId: selectedTeam,
        },
      });

      if (!license) {
        return licenseKey;
      }

      attempts++;
    }

    throw new Error(t('general.server_error'));
  };

  const licenseKey = await findUniqueLicenseKey();

  return NextResponse.json({ licenseKey });
}
