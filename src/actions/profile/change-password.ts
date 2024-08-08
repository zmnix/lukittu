'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { hashPassword, verifyPassword } from '@/lib/utils/crypto';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  changePasswordSchema,
  ChangePasswordSchema,
} from '@/lib/validation/profile/change-password-schema';
import { Provider } from '@prisma/client';
import { getTranslations } from 'next-intl/server';

// TODO: Ratelimit this endpoint
export default async function changePassword({
  newPassword,
  password,
  passwordConfirmation,
}: ChangePasswordSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await changePasswordSchema(t).safeParseAsync({
    newPassword,
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

  const session = await getSession({ user: true });

  if (session.user.provider !== Provider.CREDENTIALS) {
    return {
      isError: true,
      message: t('validation.invalid_provider'),
    };
  }

  const passwordMatch = verifyPassword(password, session.user.passwordHash!);

  if (!passwordMatch) {
    return {
      isError: true,
      message: t('validation.wrong_password'),
      field: 'password',
    };
  }

  const passwordHash = hashPassword(newPassword);

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      passwordHash,
    },
  });

  return {
    isError: false,
  };
}
