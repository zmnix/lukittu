'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  updateProfileSchema,
  UpdateProfileSchema,
} from '@/lib/validation/profile/update-profile-schema';
import { getTranslations } from 'next-intl/server';

export default async function updateProfile({ fullName }: UpdateProfileSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await updateProfileSchema(t).safeParseAsync({
    fullName,
  });

  if (!validated.success) {
    return {
      isError: true,
      message: validated.error.errors[0].message,
      field: validated.error.errors[0].path[0],
    };
  }

  const session = await getSession({ user: true });

  await prisma.user.update({
    where: {
      id: session.user.id,
    },
    data: {
      fullName,
    },
  });

  return {
    isError: false,
  };
}
