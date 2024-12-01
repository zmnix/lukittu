import { ICustomersGetResponse } from '@/app/api/(dashboard)/customers/route';
import { MultiSelect } from '@/components/ui/multi-select';
import { TeamContext } from '@/providers/TeamProvider';
import { Customer } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetchCustomers = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as ICustomersGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

interface CustomersMultiselectProps {
  onChange: (customerIds: string[], isClear?: boolean) => void;
  value?: string[];
  selectedCustomers?: Customer[];
}

export const CustomersMultiselect = ({
  onChange,
  value = [],
  selectedCustomers,
}: CustomersMultiselectProps) => {
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

  const { data, isLoading, error } = useSWR<ICustomersGetResponse>(
    teamCtx.selectedTeam
      ? ['/api/customers', teamCtx.selectedTeam, debouncedSearchQuery]
      : null,
    ([url]) =>
      fetchCustomers(
        `${url}?pageSize=25${
          debouncedSearchQuery ? `&search=${debouncedSearchQuery}` : ''
        }`,
      ),
  );

  const defaultOptions = useMemo(
    () =>
      selectedCustomers?.map((customer) => ({
        label: customer.email,
        value: customer.id,
      })) ?? [],
    [selectedCustomers],
  );

  const options = useMemo(() => {
    if (!data || 'message' in data) return [];

    return data.customers.map((customer) => ({
      label: customer.email,
      value: customer.id,
    }));
  }, [data]);

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
      defaultOptions={defaultOptions}
      loading={isLoading}
      options={options}
      placeholder={t('general.select_customers')}
      searchValue={searchQuery}
      value={value}
      onSearch={setSearchQuery}
      onValueChange={handleValueChange}
    />
  );
};
