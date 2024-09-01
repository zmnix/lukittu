import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getLanguage } from '@/lib/utils/header-helpers';
import { CustomerModalProvider } from '@/providers/CustomerModalProvider';
import { getTranslations } from 'next-intl/server';
import AddCustomerButton from './AddCustomerButton';

export default async function CustomersListCard() {
  const t = await getTranslations({ locale: getLanguage() });

  return (
    <CustomerModalProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.customers')}
            <AddCustomerButton />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>ssss</p>
        </CardContent>
      </Card>
    </CustomerModalProvider>
  );
}
