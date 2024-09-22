import LicensesListCard from '@/components/dashboard/licenses/list/LicensesListCard';
import { Separator } from '@/components/ui/separator';
import { getLanguage } from '@/lib/utils/header-helpers';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export default async function LicensesPage() {
  const t = await getTranslations({ locale: getLanguage() });

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.licenses')}
      </h1>
      <Separator className="mt-2" />
      <div className="mt-6 flex flex-col gap-6">
        <LicensesListCard />
      </div>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: getLanguage() });

  return {
    title: `${t('dashboard.navigation.licenses')} | Lukittu`,
  };
}
