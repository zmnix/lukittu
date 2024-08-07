'use server';
import prisma from '@/lib/database/prisma';
import { getLanguage } from '@/lib/utils/header-helpers';
import { sendEmail } from '@/lib/utils/nodemailer';
import {
  resendVerifyEmailSchema,
  ResendVerifyEmailSchema,
} from '@/lib/validation/auth/resend-verify-email-schema';
import { JwtTypes } from '@/types/jwt-types-enum';
import { Provider } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getTranslations } from 'next-intl/server';

export default async function resendVerifyEmail({
  email,
}: ResendVerifyEmailSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await resendVerifyEmailSchema(t).safeParseAsync({ email });

  if (!validated.success) {
    return {
      isError: true,
      message: validated.error.errors[0].message.toString(),
    };
  }

  const user = await prisma.user.findUnique({
    where: {
      email,
    },
  });

  if (!user) {
    return {
      isError: true,
      message: t('validation.invalid_email'),
    };
  }

  if (user.provider !== Provider.CREDENTIALS) {
    return {
      isError: true,
      message: t('general.wrong_provider', {
        provider: t(`auth.oauth.${user.provider.toLowerCase()}` as any),
      }),
    };
  }

  if (user.emailVerified) {
    return {
      isError: true,
      message: t('auth.resend_verify.already_verified'),
    };
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
    return {
      isError: true,
      message: t('auth.emails.sending_failed_title'),
    };
  }

  return {
    isError: false,
  };
}
