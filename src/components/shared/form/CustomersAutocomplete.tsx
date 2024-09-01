'use client';
import { ICustomersGetResponse } from '@/app/api/(dashboard)/customers/route';
import MultipleSelector from '@/components/ui/multiple-selector';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { LoadingSpinner } from '../LoadingSpinner';

interface CustomersAutocompleteProps {
  setCustomerIds: (customerIds: string[]) => void;
}

export function CustomersAutocomplete({
  setCustomerIds,
}: CustomersAutocompleteProps) {
  const t = useTranslations();
  return (
    <MultipleSelector
      defaultOptions={[]}
      emptyIndicator={<div className="flex">{t('general.no_results')}</div>}
      loadingIndicator={
        <div className="flex items-center justify-center py-2">
          <LoadingSpinner />
        </div>
      }
      placeholder={t('dashboard.licenses.search_customer')}
      triggerSearchOnFocus
      onChange={(value) => {
        setCustomerIds(value.map((v) => v.value));
      }}
      onSearch={async (value) => {
        const response = await fetch(`/api/customers?search=${value}`);
        const data = (await response.json()) as ICustomersGetResponse;

        if ('message' in data) {
          toast.error(data.message);
          return [];
        }

        const results = data.customers.map((customer) => ({
          label: customer.fullName ?? customer.email!,
          value: customer.id.toString(),
        }));

        return results;
      }}
    />
  );
}
