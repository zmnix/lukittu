'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  createTeamSchema,
  CreateTeamSchema,
} from '@/lib/validation/team/create-team-schema';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export default async function createTeam({ name }: CreateTeamSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await createTeamSchema(t).safeParseAsync({
    name,
  });

  if (!validated.success) {
    return {
      isError: true,
      message: validated.error.errors[0].message,
      field: validated.error.errors[0].path[0],
    };
  }

  const session = await getSession({ user: true });

  const createdTeam = await prisma.team.create({
    data: {
      name,
      ownerId: session.user.id,
      users: {
        connect: {
          id: session.user.id,
        },
      },
    },
  });

  cookies().set('selectedTeam', createdTeam.id.toString(), {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5),
  });

  return {
    isError: false,
  };
}
