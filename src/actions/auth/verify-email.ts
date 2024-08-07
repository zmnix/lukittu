'use server';
import prisma from '@/lib/database/prisma';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  verifyEmaiLSchema,
  VerifyEmailSchema,
} from '@/lib/validation/auth/verify-email-schema';
import { JwtTypes } from '@/types/jwt-types-enum';
import { Provider } from '@prisma/client';
import jwt from 'jsonwebtoken';
import { getTranslations } from 'next-intl/server';

export default async function verifyEmail({ token }: VerifyEmailSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await verifyEmaiLSchema(t).safeParseAsync({ token });

  if (!validated.success) {
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

    if (decoded.type !== JwtTypes.NEW_ACCOUNT_EMAIL_VERIFICATION) {
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

  if (user.emailVerified) {
    return {
      isError: true,
      message: t('validation.email_already_verified'),
    };
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
    },
  });

  return {
    isError: false,
    message: t('auth.verify_email.verification_success'),
  };
}
