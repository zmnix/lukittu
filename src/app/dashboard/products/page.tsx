import ProductsListCard from '@/components/dashboard/products/ProductsListCard';
import { Separator } from '@/components/ui/separator';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getSelectedTeam } from '@/lib/utils/header-helpers';
import { getTranslations } from 'next-intl/server';

export default async function ProductsPage() {
  const t = await getTranslations();
  const session = await getSession({ user: true });
  const selectedTeam = getSelectedTeam();

  if (!selectedTeam) {
    return null;
  }

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
        },
      },
    },
  });

  if (!teamProducts) {
    return null;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.products')}
      </h1>
      <Separator className="mt-2" />
      <div className="mt-6 flex flex-col gap-6">
        <ProductsListCard products={teamProducts.products} />
      </div>
    </div>
  );
}
