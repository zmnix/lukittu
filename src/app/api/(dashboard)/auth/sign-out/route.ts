import prisma from '@/lib/database/prisma';
import { getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

type IAuthSignOutSuccessResponse = {
  success: boolean;
};

export type IAuthSignOutResponse = ErrorResponse | IAuthSignOutSuccessResponse;

export async function POST(): Promise<NextResponse<IAuthSignOutResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  cookies().set('session', '', {
    expires: new Date(0),
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  try {
    const sessionId = cookies().get('session')?.value;

    if (sessionId) {
      await prisma.session.delete({
        where: { sessionId },
      });
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error("Error occurred in 'sign-out' route:", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
