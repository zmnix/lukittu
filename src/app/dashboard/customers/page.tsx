import { Separator } from '@/components/ui/separator';
import { getTranslations } from 'next-intl/server';

export default async function CustomersPage() {
  const t = await getTranslations();
  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.customers')}
      </h1>
      <Separator className="mt-2" />
    </div>
  );
}
