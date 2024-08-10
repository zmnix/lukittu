import { Separator } from '@/components/ui/separator';
import { getTranslations } from 'next-intl/server';

export default async function ProductsPage() {
  const t = await getTranslations();
  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.products')}
      </h1>
      <Separator className="mt-2" />
    </div>
  );
}
