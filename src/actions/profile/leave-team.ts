'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { getTranslations } from 'next-intl/server';

export default async function leaveTeam(teamId: number) {
  const t = await getTranslations({ locale: getLanguage() });

  if (isNaN(teamId) || teamId <= 0) {
    return {
      isError: true,
      message: t('validation.bad_request'),
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

  const team = session.user.teams.find((t) => t.id === teamId);

  if (!team) {
    return {
      isError: true,
      message: t('validation.team_not_found'),
    };
  }

  if (team.ownerId === session.user.id) {
    return {
      isError: true,
      message: t('validation.team_owner_cannot_leave'),
    };
  }

  await prisma.team.update({
    where: {
      id: teamId,
    },
    data: {
      users: {
        disconnect: {
          id: session.user.id,
        },
      },
    },
  });

  return {
    isError: false,
  };
}
