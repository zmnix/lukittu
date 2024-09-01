import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLanguage } from '@/lib/utils/header-helpers';
import { LicenseModalProvider } from '@/providers/LicenseModalProvider';
import { getTranslations } from 'next-intl/server';
import AddLicenseButton from './AddLicenseButton';
import { LicensesListTable } from './LicensesListTable';

export default async function LicensesListCard() {
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
          <LicensesListTable />
        </CardContent>
      </Card>
    </LicenseModalProvider>
  );
}
