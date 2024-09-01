'use client';
import { IProductsGetResponse } from '@/app/api/products/route';
import MultipleSelector from '@/components/ui/multiple-selector';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { LoadingSpinner } from '../LoadingSpinner';

interface ProductsAutocompleteProps {
  setProductIds: (productIds: number[]) => void;
}

export function ProductsAutocomplete({
  setProductIds,
}: ProductsAutocompleteProps) {
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
      placeholder={t('dashboard.licenses.search_product')}
      triggerSearchOnFocus
      onChange={(value) => {
        setProductIds(value.map((v) => parseInt(v.value)));
      }}
      onSearch={async (value) => {
        const response = await fetch(`/api/products?search=${value}`);
        const data = (await response.json()) as IProductsGetResponse;

        if ('message' in data) {
          toast.error(data.message);
          return [];
        }

        const results = data.products.map((product) => ({
          label: product.name,
          value: product.id.toString(),
        }));

        return results;
      }}
    />
  );
}
