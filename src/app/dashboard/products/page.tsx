import ProductsListCard from '@/components/dashboard/products/ProductsListCard';
import { Separator } from '@/components/ui/separator';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getSelectedTeam } from '@/lib/utils/header-helpers';
import { getTranslations } from 'next-intl/server';

interface ProductsPageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProductsPage({
  searchParams,
}: ProductsPageProps) {
  const t = await getTranslations();
  const session = await getSession({ user: true });
  const selectedTeam = getSelectedTeam();

  if (!selectedTeam) return null;

  const allowedPageSizes = [25, 50, 100];
  const allowedSortDirections = ['asc', 'desc'];
  const allowedSortColumns = ['name', 'createdAt'];

  let page = parseInt(searchParams.page as string) || 1;
  let pageSize = parseInt(searchParams.pageSize as string) || 10;
  let sortColumn = searchParams.sortColumn as string;
  let sortDirection = searchParams.sortDirection as 'asc' | 'desc';
  let search = (searchParams.search as string) || '';

  if (!allowedSortDirections.includes(sortDirection)) {
    sortDirection = 'desc';
  }

  if (!sortColumn || !allowedSortColumns.includes(sortColumn)) {
    sortColumn = 'createdAt';
  }

  if (!allowedPageSizes.includes(pageSize)) {
    pageSize = 25;
  }

  if (page < 1) {
    page = 1;
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const teamProducts = await prisma.team.findUnique({
    where: {
      id: selectedTeam,
      deletedAt: null,
      users: {
        some: {
          id: session.user.id,
        },
      },
    },
    include: {
      products: {
        where: {
          deletedAt: null,
          teamId: selectedTeam,
          name: search
            ? {
                contains: search,
                mode: 'insensitive',
              }
            : undefined,
        },
        skip,
        take,
        orderBy: {
          [sortColumn]: sortDirection,
        },
      },
      _count: {
        select: {
          products: {
            where: {
              deletedAt: null,
              teamId: selectedTeam,
              name: search
                ? { contains: search, mode: 'insensitive' }
                : undefined,
            },
          },
        },
      },
    },
  });

  const teamHasProducts = await prisma.product.findFirst({
    where: {
      teamId: selectedTeam,
      deletedAt: null,
    },
  });

  if (!teamProducts) return null;

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.products')}
      </h1>
      <Separator className="mt-2" />
      <div className="mt-6 flex flex-col gap-6">
        <ProductsListCard
          hasProducts={Boolean(teamHasProducts)}
          products={teamProducts.products}
          total={teamProducts._count.products}
        />
      </div>
    </div>
  );
}
