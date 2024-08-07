'use server';
import prisma from '@/lib/database/prisma';
import { hashPassword } from '@/lib/utils/crypto';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  resetPasswordSchema,
  ResetPasswordSchema,
} from '@/lib/validation/auth/reset-password-schema';
import { JwtTypes } from '@/types/jwt-types-enum';
import { Provider } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getTranslations } from 'next-intl/server';

export async function resetPassword({
  token,
  password,
  passwordConfirmation,
}: ResetPasswordSchema & { token: string }) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await resetPasswordSchema(t).safeParseAsync({
    password,
    passwordConfirmation,
  });

  if (!validated.success) {
    return {
      isError: true,
      message: validated.error.errors[0].message,
      field: validated.error.errors[0].path[0],
    };
  }

  if (typeof token !== 'string') {
    return {
      isError: true,
      message: t('validation.invalid_token'),
    };
  }

  let decodedToken: {
    userId: number;
    type: JwtTypes;
  };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!);

    if (typeof decoded === 'string') {
      return {
        isError: true,
        message: t('validation.invalid_token'),
      };
    }

    if (decoded.type !== JwtTypes.PASSWORD_RESET) {
      return {
        isError: true,
        message: t('validation.invalid_token'),
      };
    }

    decodedToken = decoded as {
      userId: number;
      type: JwtTypes;
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return {
        isError: true,
        message: t('auth.emails.expired_link'),
      };
    }

    return {
      isError: true,
      message: t('validation.invalid_token'),
    };
  }

  const user = await prisma.user.findUnique({
    where: { id: decodedToken.userId },
  });

  if (!user) {
    return {
      isError: true,
      message: t('validation.user_not_found'),
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

  const passwordHash = hashPassword(password);

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return {
    isError: false,
  };
}
