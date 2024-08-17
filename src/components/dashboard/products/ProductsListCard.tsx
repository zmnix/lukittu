import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductModalProvider } from '@/providers/ProductModalProvider';
import { getTranslations } from 'next-intl/server';
import { Suspense } from 'react';
import TableSearch from '../../shared/table/TableSearch';
import AddProductButton from './AddProductButton';
import { ProductListTable } from './ProductListTable';

interface ProductsListCardProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function ProductsListCard({
  searchParams,
}: ProductsListCardProps) {
  const t = await getTranslations();

  return (
    <ProductModalProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.products')}
            <AddProductButton />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableSearch />
          <Suspense fallback={<div>Loading...</div>}>
            <ProductListTable searchParams={searchParams} />
          </Suspense>
        </CardContent>
      </Card>
    </ProductModalProvider>
  );
}
