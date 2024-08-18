import prisma from '@/lib/database/prisma';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  verifyEmaiLSchema,
  VerifyEmailSchema,
} from '@/lib/validation/auth/verify-email-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { JwtTypes } from '@/types/jwt-types-enum';
import { Provider } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type VerifyEmailResponse =
  | ErrorResponse
  | {
      success: boolean;
    };

export async function POST(
  request: NextRequest,
): Promise<NextResponse<VerifyEmailResponse>> {
  const body = (await request.json()) as VerifyEmailSchema;

  const t = await getTranslations({ locale: getLanguage() });
  const validated = await verifyEmaiLSchema(t).safeParseAsync(body);

  if (!validated.success) {
    return NextResponse.json(
      {
        message: validated.error.errors[0].message,
        field: validated.error.errors[0].path[0],
      },
      { status: 400 },
    );
  }

  const { token } = validated.data;

  let decodedToken: {
    userId: number;
    type: JwtTypes;
  };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (typeof decoded === 'string') {
      return NextResponse.json(
        {
          message: t('validation.invalid_token'),
        },
        { status: 400 },
      );
    }

    if (decoded.type !== JwtTypes.NEW_ACCOUNT_EMAIL_VERIFICATION) {
      return NextResponse.json(
        {
          message: t('validation.invalid_token'),
        },
        { status: 400 },
      );
    }

    decodedToken = decoded as {
      userId: number;
      type: JwtTypes;
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return NextResponse.json(
        {
          message: t('auth.emails.expired_link'),
        },
        { status: 400 },
      );
    }

    return NextResponse.json(
      {
        message: t('validation.invalid_token'),
      },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.userId },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: t('validation.user_not_found'),
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

  if (user.emailVerified) {
    return NextResponse.json(
      {
        message: t('validation.email_already_verified'),
      },
      { status: 400 },
    );
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
    },
  });

  return NextResponse.json({ success: true });
}
