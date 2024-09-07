'use client';
import { IProductsGetResponse } from '@/app/api/(dashboard)/products/route';
import MultipleSelector from '@/components/ui/multiple-selector';
import { Product } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { LoadingSpinner } from '../LoadingSpinner';

interface ProductsAutocompleteProps {
  setProductIds: (productIds: string[]) => void;
  productIds: string[];
  initialProducts?: Product[];
}

export function ProductsAutocomplete({
  setProductIds,
  initialProducts,
  productIds,
}: ProductsAutocompleteProps) {
  const t = useTranslations();

  const selectedProducts = productIds.map((id) => {
    const match = initialProducts?.find((p) => p.id === id);

    return {
      label: match?.name ?? '',
      value: id,
    };
  });

  return (
    <MultipleSelector
      emptyIndicator={<div className="flex">{t('general.no_results')}</div>}
      loadingIndicator={
        <div className="flex items-center justify-center py-2">
          <LoadingSpinner />
        </div>
      }
      placeholder={t('dashboard.licenses.search_product')}
      value={selectedProducts}
      triggerSearchOnFocus
      onChange={(value) => {
        setProductIds(value.map((v) => v.value));
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
