'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import {
  setProductSchema,
  SetProductSchema,
} from '@/lib/validation/products/set-product-schema';
import { getTranslations } from 'next-intl/server';

export default async function setProduct({
  name,
  url,
  description,
  id,
}: SetProductSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await setProductSchema(t).safeParseAsync({
    name,
    url,
    description,
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

  const team = await prisma.team.findUnique({
    where: {
      id: selectedTeam,
      deletedAt: null,
    },
    include: {
      products: {
        where: {
          deletedAt: null,
        },
      },
    },
  });

  if (!team) {
    return {
      isError: true,
      message: t('validation.team_not_found'),
    };
  }

  if (!id && team.products.find((product) => product.name === name)) {
    return {
      isError: true,
      message: t('validation.product_already_exists'),
      field: 'name',
    };
  }

  const product = await prisma.product.upsert({
    where: {
      id: id || 0,
      teamId: selectedTeam,
    },
    create: {
      name,
      url: url || null,
      description: description || null,
      team: {
        connect: {
          id: selectedTeam,
        },
      },
    },
    update: {
      name,
      url: url || null,
      description: description || null,
    },
  });

  return {
    isError: false,
    product,
  };
}
