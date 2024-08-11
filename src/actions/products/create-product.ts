'use server';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import {
  createProductSchema,
  CreateProductSchema,
} from '@/lib/validation/products/create-product-schema';
import { getTranslations } from 'next-intl/server';

export default async function createProduct({
  name,
  url,
  description,
}: CreateProductSchema) {
  const t = await getTranslations({ locale: getLanguage() });
  const validated = await createProductSchema(t).safeParseAsync({
    name,
    url,
    description,
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
        teams: true,
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
    },
    include: {
      products: true,
    },
  });

  if (!team) {
    return {
      isError: true,
      message: t('validation.team_not_found'),
    };
  }

  if (team.products.find((product) => product.name === name)) {
    return {
      isError: true,
      message: t('validation.product_already_exists'),
      field: 'name',
    };
  }

  const product = await prisma.product.create({
    data: {
      name,
      url: url || null,
      description: description || null,
      team: {
        connect: {
          id: selectedTeam,
        },
      },
    },
  });

  return {
    isError: false,
    product,
  };
}
