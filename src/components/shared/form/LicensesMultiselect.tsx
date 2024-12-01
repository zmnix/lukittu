import { ILicensesGetResponse } from '@/app/api/(dashboard)/licenses/route';
import { MultiSelect } from '@/components/ui/multi-select';
import { TeamContext } from '@/providers/TeamProvider';
import { License } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetchLicenses = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as ILicensesGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

interface LicensesMultiselectProps {
  onChange: (licenseIds: string[], isClear?: boolean) => void;
  value?: string[];
  selectedLicenses?: Omit<License, 'licenseKeyLookup'>[] | undefined;
  disabled?: boolean;
}

export const LicensesMultiselect = ({
  onChange,
  value = [],
  selectedLicenses,
  disabled = false,
}: LicensesMultiselectProps) => {
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

  const { data, isLoading, error } = useSWR<ILicensesGetResponse>(
    teamCtx.selectedTeam
      ? ['/api/licenses', teamCtx.selectedTeam, debouncedSearchQuery]
      : null,
    ([url]) =>
      fetchLicenses(
        `${url}?pageSize=25${
          debouncedSearchQuery ? `&search=${debouncedSearchQuery}` : ''
        }`,
      ),
  );

  const defaultOptions = useMemo(
    () =>
      selectedLicenses?.map((license) => ({
        label: license.licenseKey,
        value: license.id,
      })) ?? [],
    [selectedLicenses],
  );

  const options = useMemo(() => {
    if (!data || 'message' in data) return [];

    return data.licenses.map((license) => ({
      label: license.licenseKey,
      value: license.id,
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
      disabled={disabled}
      loading={isLoading}
      options={options}
      placeholder={t('general.select_licenses')}
      searchValue={searchQuery}
      value={value}
      onSearch={setSearchQuery}
      onValueChange={handleValueChange}
    />
  );
};
