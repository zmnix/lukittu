'use server';
import prisma from '@/lib/database/prisma';
import { getLanguage } from '@/lib/utils/header-helpers';
import { sendEmail } from '@/lib/utils/nodemailer';
import {
  forgotPasswordSchema,
  ForgotPasswordSchema,
} from '@/lib/validation/auth/forgot-password-schema';
import { JwtTypes } from '@/types/jwt-types-enum';
import { Provider } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getTranslations } from 'next-intl/server';

export default async function forgotPassword({ email }: ForgotPasswordSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await forgotPasswordSchema(t).safeParseAsync({ email });

  if (!validated.success) {
    return {
      isError: true,
      message: validated.error.errors[0].message,
      field: validated.error.errors[0].path[0],
    };
  }

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.emailVerified) {
    return {
      isError: false, // Basically an error, but we don't want to expose this
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

  const token = jwt.sign(
    {
      userId: user.id,
      type: JwtTypes.PASSWORD_RESET,
    },
    process.env.JWT_SECRET!,
    {
      expiresIn: '1h',
    },
  );

  const resetLink = `${process.env.NEXT_PUBLIC_BASE_URL}/auth/reset-password?token=${token}`;

  // TODO: Translate email
  const success = await sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html: `
      <p>
        You requested a password reset. Click the link below to reset your password.
      </p>
      <a href="${resetLink}">Reset Password</a>
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
