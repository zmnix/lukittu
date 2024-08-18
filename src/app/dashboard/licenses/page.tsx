import LicenseListCard from '@/components/dashboard/licenses/LicenseListCard';
import { Separator } from '@/components/ui/separator';
import { getLanguage } from '@/lib/utils/header-helpers';
import { getTranslations } from 'next-intl/server';

interface LicensePageProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function LicensesPage({ searchParams }: LicensePageProps) {
  const t = await getTranslations({ locale: getLanguage() });

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.licenses')}
      </h1>
      <Separator className="mt-2" />
      <div className="mt-6 flex flex-col gap-6">
        <LicenseListCard searchParams={searchParams} />
      </div>
    </div>
  );
}
