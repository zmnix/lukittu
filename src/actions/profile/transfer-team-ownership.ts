'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage } from '@/lib/utils/header-helpers';
import { getTranslations } from 'next-intl/server';

export default async function transferTeamOwnership(
  teamId: number,
  newOwnerId: number,
) {
  const t = await getTranslations({ locale: getLanguage() });

  if (isNaN(teamId) || teamId <= 0) {
    return {
      isError: true,
      message: t('validation.bad_request'),
    };
  }

  if (isNaN(newOwnerId) || newOwnerId <= 0) {
    return {
      isError: true,
      message: t('validation.bad_request'),
    };
  }

  const session = await getSession({ user: true });

  const team = await prisma.team.findFirst({
    where: {
      id: teamId,
      deletedAt: null,
    },
    include: {
      users: true,
    },
  });

  if (!team) {
    return {
      isError: true,
      message: t('validation.team_not_found'),
    };
  }

  if (team.ownerId !== session.user.id) {
    return {
      isError: true,
      message: t('validation.unauthorized'),
    };
  }

  if (!team.users.find((u) => u.id === newOwnerId)) {
    return {
      isError: true,
      message: t('validation.user_not_in_team'),
    };
  }

  await prisma.team.update({
    where: {
      id: teamId,
    },
    data: {
      ownerId: newOwnerId,
    },
  });

  return {
    isError: false,
  };
}
