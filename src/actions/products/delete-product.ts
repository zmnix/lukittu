'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { getTranslations } from 'next-intl/server';

export default async function deleteProduct(
  productId: number,
  productNameConfirmation: string,
) {
  const t = await getTranslations({ locale: getLanguage() });

  if (isNaN(productId) || productId <= 0) {
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

  const selectedTeam = getSelectedTeam();

  if (!selectedTeam) {
    return {
      isError: true,
      message: t('validation.team_not_found'),
    };
  }

  if (!session.user.teams.find((team) => team.id === selectedTeam)) {
    return {
      isError: true,
      message: t('validation.team_not_found'),
    };
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      teamId: selectedTeam,
      deletedAt: null,
    },
  });

  if (!product) {
    return {
      isError: true,
      message: t('validation.product_not_found'),
    };
  }

  if (productNameConfirmation !== product.name.toUpperCase()) {
    return {
      isError: true,
      message: t('validation.bad_request'),
    };
  }

  // TODO: Mark all licenses as deleted
  await prisma.product.update({
    where: {
      id: productId,
    },
    data: {
      deletedAt: new Date(),
    },
  });

  return {
    isError: false,
  };
}
