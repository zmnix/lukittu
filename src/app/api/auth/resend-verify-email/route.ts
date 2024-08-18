import prisma from '@/lib/database/prisma';
import { getLanguage } from '@/lib/utils/header-helpers';
import { sendEmail } from '@/lib/utils/nodemailer';
import {
  resendVerifyEmailSchema,
  ResendVerifyEmailSchema,
} from '@/lib/validation/auth/resend-verify-email-schema';
import { ErrorResponse } from '@/types/common-api-types';
import { JwtTypes } from '@/types/jwt-types-enum';
import { Provider } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getTranslations } from 'next-intl/server';
import { NextRequest, NextResponse } from 'next/server';

export type ResendVerifyEmailResponse =
  | ErrorResponse
  | {
      success: boolean;
    };

export async function POST(
  request: NextRequest,
): Promise<NextResponse<ResendVerifyEmailResponse>> {
  const body = (await request.json()) as ResendVerifyEmailSchema;

  const t = await getTranslations({ locale: getLanguage() });
  const validated = await resendVerifyEmailSchema(t).safeParseAsync(body);

  if (!validated.success) {
    return NextResponse.json(
      {
        message: validated.error.errors[0].message,
        field: validated.error.errors[0].path[0],
      },
      { status: 400 },
    );
  }

  const { email } = validated.data;

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return NextResponse.json(
      {
        message: t('validation.invalid_email'),
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
        message: t('auth.resend_verify.already_verified'),
      },
      { status: 400 },
    );
  }

  const token = jwt.sign(
    {
      userId: user.id,
      type: JwtTypes.NEW_ACCOUNT_EMAIL_VERIFICATION,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '30m',
    },
  );

  const verifyLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/verify-email?token=${token}`;

  const success = await sendEmail({
    to: email,
    subject: 'Verify your email address',
    html: `
              <p>
                  Welcome to our app! To get started, please verify your email address by clicking the link below.
              </p>
              <a href="${verifyLink}">Verify email address</a>
          `,
  });

  if (!success) {
    return NextResponse.json(
      {
        message: t('auth.emails.sending_failed_title'),
      },
      { status: 500 },
    );
  }

  return NextResponse.json({
    success: true,
  });
}
