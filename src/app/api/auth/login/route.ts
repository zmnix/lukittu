import prisma from '@/lib/database/prisma';
import { createSession } from '@/lib/utils/auth';
import { verifyTurnstileToken } from '@/lib/utils/cloudflare-helpers';
import { verifyPassword } from '@/lib/utils/crypto';
import { getLanguage } from '@/lib/utils/header-helpers';
import { loginSchema, LoginSchema } from '@/lib/validation/auth/login-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { Provider } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type LoginPostResponse =
  | ErrorResponse
  | {
      success: boolean;
    };

export async function POST(
  request: NextRequest,
): Promise<NextResponse<LoginPostResponse>> {
  const body = (await request.json()) as LoginSchema;

  const t = await getTranslations({ locale: getLanguage() });
  const validated = await loginSchema(t).safeParseAsync(body);

  if (!validated.success) {
    return NextResponse.json(
      {
        message: validated.error.errors[0].message,
        field: validated.error.errors[0].path[0],
      },
      { status: 400 },
    );
  }

  const { email, password, rememberMe, token } = validated.data;

  const turnstileValid = await verifyTurnstileToken(token);

  if (!turnstileValid) {
    return NextResponse.json(
      {
        message: t('validation.invalid_turnstile_token'),
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: t('auth.login.invalid_email_password'),
      },
      { status: 400 },
    );
  }

  if (user.provider !== Provider.CREDENTIALS) {
    return NextResponse.json(
      {
        message: t('general.wrong_provider', {
          provider: t(`auth.oauth.${user.provider.toLowerCase()}` as any),
        }),
      },
      { status: 400 },
    );
  }

  if (!user.emailVerified) {
    return NextResponse.json(
      {
        message: t('auth.login.email_not_verified'),
        reverifyEmail: true,
      },
      { status: 400 },
    );
  }

  const passwordMatch = verifyPassword(password, user.passwordHash!);

  if (!passwordMatch) {
    return NextResponse.json(
      {
        message: t('auth.login.invalid_email_password'),
      },
      { status: 400 },
    );
  }

  await createSession(user.id, rememberMe);

  return NextResponse.json({
    success: true,
  });
}
