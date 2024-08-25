import prisma from '@/lib/database/prisma';
import { createSession } from '@/lib/utils/auth';
import { verifyTurnstileToken } from '@/lib/utils/cloudflare-helpers';
import { verifyPassword } from '@/lib/utils/crypto';
import { getLanguage } from '@/lib/utils/header-helpers';
import { logger } from '@/lib/utils/logger';
import { loginSchema, LoginSchema } from '@/lib/validation/auth/login-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { HttpStatus } from '@/types/http-status';
import { Provider } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

type ILoginSuccessResponse = {
  success: boolean;
};

export type ILoginResponse = ErrorResponse | ILoginSuccessResponse;

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ILoginResponse>> {
  const t = await getTranslations({ locale: getLanguage() });

  try {
    const body = (await request.json()) as LoginSchema;
    const validated = await loginSchema(t).safeParseAsync(body);

    if (!validated.success) {
      return NextResponse.json(
        {
          message: validated.error.errors[0].message,
          field: validated.error.errors[0].path[0],
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const { email, password, rememberMe, token } = validated.data;

    const turnstileValid = await verifyTurnstileToken(token);

    if (!turnstileValid) {
      return NextResponse.json(
        {
          message: t('validation.invalid_turnstile_token'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      omit: {
        passwordHash: false,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          message: t('auth.login.invalid_email_password'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (user.provider !== Provider.CREDENTIALS) {
      return NextResponse.json(
        {
          message: t('general.wrong_provider', {
            provider: t(`auth.oauth.${user.provider.toLowerCase()}` as any),
          }),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          message: t('auth.login.email_not_verified'),
          reverifyEmail: true,
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const passwordMatch = verifyPassword(password, user.passwordHash!);

    if (!passwordMatch) {
      return NextResponse.json(
        {
          message: t('auth.login.invalid_email_password'),
        },
        { status: HttpStatus.BAD_REQUEST },
      );
    }

    const session = await createSession(user.id, rememberMe);

    if (!session) {
      return NextResponse.json(
        {
          message: t('general.server_error'),
        },
        { status: HttpStatus.INTERNAL_SERVER_ERROR },
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (error) {
    logger.error("Error occurred in 'login' route", error);
    return NextResponse.json(
      {
        message: t('general.server_error'),
      },
      { status: HttpStatus.INTERNAL_SERVER_ERROR },
    );
  }
}
