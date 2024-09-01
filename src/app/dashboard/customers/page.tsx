import CustomersListCard from '@/components/dashboard/customers/CustomersListCard';
import { Separator } from '@/components/ui/separator';
import { getLanguage } from '@/lib/utils/header-helpers';
import { getTranslations } from 'next-intl/server';

export default async function CustomersPage() {
  const t = await getTranslations({ locale: getLanguage() });
  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.customers')}
      </h1>
      <Separator className="mt-2" />
      <div className="mt-6 flex flex-col gap-6">
        <CustomersListCard />
      </div>
    </div>
  );
}
