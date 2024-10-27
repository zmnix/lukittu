import { ReleasesTable } from '@/components/dashboard/releases/list/ReleasesTable';
import { Separator } from '@/components/ui/separator';
import { getLanguage } from '@/lib/utils/header-helpers';
import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';

export default async function ProductReleasesPage() {
  const t = await getTranslations({ locale: await getLanguage() });

  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.releases')}
      </h1>
      <Separator className="mt-2" />
      <div className="mt-6 flex flex-col gap-6">
        <ReleasesTable />
      </div>
    </div>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: await getLanguage() });

  return {
    title: `${t('dashboard.navigation.releases')} | Lukittu`,
  };
}
