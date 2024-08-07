'use server';
import prisma from '@/lib/database/prisma';
import { createSession } from '@/lib/utils/auth';
import { verifyPassword } from '@/lib/utils/crypto';
import { getLanguage } from '@/lib/utils/header-helpers';
import { loginSchema, LoginSchema } from '@/lib/validation/auth/login-schema';
import { Provider } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { redirect, RedirectType } from 'next/navigation';

export default async function loginWithCredentials({
  email,
  password,
  rememberMe,
}: LoginSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await loginSchema(t).safeParseAsync({
    email,
    password,
    rememberMe,
  });

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

  if (!user) {
    return {
      isError: true,
      message: t('auth.login.invalid_email_password'),
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

  if (!user.emailVerified) {
    return {
      isError: true,
      reverifyEmail: true,
    };
  }

  const passwordMatch = verifyPassword(password, user.passwordHash!);

  if (!passwordMatch) {
    return {
      isError: true,
      message: t('auth.login.invalid_email_password'),
    };
  }

  await createSession(user.id, rememberMe);

  redirect('/dashboard', RedirectType.replace);
}
