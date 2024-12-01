import { IProductsGetResponse } from '@/app/api/(dashboard)/products/route';
import { MultiSelect } from '@/components/ui/multi-select';
import { TeamContext } from '@/providers/TeamProvider';
import { Product } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetchProducts = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as IProductsGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

interface ProductsMultiselectProps {
  onChange: (productIds: string[], isClear?: boolean) => void;
  value?: string[];
  selectedProducts: Product[] | undefined;
}

export const ProductsMultiselect = ({
  onChange,
  value = [],
  selectedProducts,
}: ProductsMultiselectProps) => {
  const t = useTranslations();
  const teamCtx = useContext(TeamContext);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const { data, isLoading, error } = useSWR<IProductsGetResponse>(
    teamCtx.selectedTeam
      ? ['/api/products', teamCtx.selectedTeam, debouncedSearchQuery]
      : null,
    ([url]) =>
      fetchProducts(
        `${url}?pageSize=25${
          debouncedSearchQuery ? `&search=${debouncedSearchQuery}` : ''
        }`,
      ),
  );

  const options = useMemo(() => {
    const defaultOptions =
      selectedProducts?.map((product) => ({
        label: product.name,
        value: product.id,
      })) ?? [];

    if (!data || 'message' in data) return defaultOptions;

    const fetchedOptions = data.products.map((product) => ({
      label: product.name,
      value: product.id,
    }));

    return Array.from(
      new Map(
        [...defaultOptions, ...fetchedOptions].map((item) => [
          item.value,
          item,
        ]),
      ).values(),
    );
  }, [data, selectedProducts]);

  const handleValueChange = (newValue: string[], isClear?: boolean) => {
    if (isClear) {
      onChange([], true);
      return;
    }

    const removedId = value.find((id) => !newValue.includes(id));
    if (removedId && newValue.length < value.length) {
      onChange(newValue);
    } else {
      onChange(newValue);
    }
  };

  if (error) {
    toast.error(error.message ?? t('general.server_error'));
  }

  return (
    <MultiSelect
      className="bg-background"
      loading={isLoading}
      options={options}
      placeholder={t('general.select_products')}
      searchValue={searchQuery}
      value={value}
      onSearch={setSearchQuery}
      onValueChange={handleValueChange}
    />
  );
};
