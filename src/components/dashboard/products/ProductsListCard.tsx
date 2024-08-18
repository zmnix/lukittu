import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLanguage } from '@/lib/utils/header-helpers';
import { ProductModalProvider } from '@/providers/ProductModalProvider';
import { getTranslations } from 'next-intl/server';
import AddProductButton from './AddProductButton';
import { ProductListTable } from './ProductListTable';

export default async function ProductsListCard() {
  const t = await getTranslations({ locale: getLanguage() });

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
          <ProductListTable />
        </CardContent>
      </Card>
    </ProductModalProvider>
  );
}
