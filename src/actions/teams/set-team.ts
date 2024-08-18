'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import {
  setTeamSchema,
  SetTeamSchema,
} from '@/lib/validation/team/set-team-schema';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export default async function setTeam({ name, id }: SetTeamSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await setTeamSchema(t).safeParseAsync({
    name,
    id,
  });

  if (!validated.success) {
    return {
      isError: true,
      message: validated.error.errors[0].message,
      field: validated.error.errors[0].path[0],
    };
  }

  const session = await getSession({
    user: {
      include: {
        teams: {
          where: {
            deletedAt: null,
          },
        },
      },
    },
  });

  if (id && !session.user.teams.some((team) => team.id === id)) {
    return {
      isError: true,
      message: t('validation.team_not_found'),
      field: 'id',
    };
  }

  const createdTeam = await prisma.team.upsert({
    where: {
      id: id || 0,
    },
    create: {
      name,
      ownerId: session.user.id,
      users: {
        connect: {
          id: session.user.id,
        },
      },
    },
    update: {
      name,
    },
  });

  cookies().set('selectedTeam', createdTeam.id.toString(), {
    expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 5),
  });

  return {
    isError: false,
  };
}
