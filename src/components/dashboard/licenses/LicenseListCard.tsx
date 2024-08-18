import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLanguage } from '@/lib/utils/header-helpers';
import { LicenseModalProvider } from '@/providers/LicenseModalProvider';
import { getTranslations } from 'next-intl/server';
import AddLicenseButton from './AddLicenseButton';

interface LicenseListCardProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export default async function LicenseListCard({
  searchParams,
}: LicenseListCardProps) {
  const t = await getTranslations({ locale: getLanguage() });

  return (
    <LicenseModalProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.licenses')}
            <AddLicenseButton />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>s</p>
        </CardContent>
      </Card>
    </LicenseModalProvider>
  );
}
