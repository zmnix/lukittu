import { ILicensesGetResponse } from '@/app/api/(dashboard)/licenses/route';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils/tailwind-helpers';
import { TeamContext } from '@/providers/TeamProvider';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { LoadingSpinner } from '../LoadingSpinner';

const fetchLicenses = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as ILicensesGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

interface LicensesMultiselectProps {
  onChange: (licenseIds: string[]) => void;
  initialValue?: string[];
  disabled?: boolean;
}

export const LicensesMultiselect = ({
  onChange,
  initialValue = [],
  disabled = false,
}: LicensesMultiselectProps) => {
  const t = useTranslations();
  const teamCtx = useContext(TeamContext);

  const [open, setOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>(initialValue);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const searchParams = new URLSearchParams({
    pageSize: '25',
    search: debouncedSearchQuery,
  });

  const { data, isLoading, error } = useSWR<ILicensesGetResponse>(
    teamCtx.selectedTeam
      ? ['/api/licenses', teamCtx.selectedTeam, searchParams.toString()]
      : null,
    ([url, _, params]) => fetchLicenses(`${url}?${params}`),
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (error) {
      toast.error(error.message ?? t('general.server_error'));
    }
  }, [error, t]);

  const licenses = useMemo(() => {
    if (!data || 'message' in data) return [];
    return data.licenses.map((license) => ({
      name: license.licenseKey,
      id: license.id,
    }));
  }, [data]);

  const filteredLicenses = useMemo(
    () =>
      licenses.filter((license) =>
        license.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, licenses],
  );

  const highlightText = useCallback((text: string, highlight: string) => {
    if (!highlight.trim()) {
      return text;
    }

    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      part.toLowerCase() === highlight.toLowerCase() ? (
        <strong key={index}>{part}</strong>
      ) : (
        part
      ),
    );
  }, []);

  const handleSelect = useCallback(
    (licenseId: string) => {
      const currentSelected = [...selectedItems];
      const newSelected = currentSelected.includes(licenseId)
        ? currentSelected.filter((i) => i !== licenseId)
        : [...currentSelected, licenseId];

      setSelectedItems(newSelected);
      onChange(newSelected);
    },
    [onChange, selectedItems],
  );

  useEffect(() => {
    setSelectedItems(initialValue);
  }, [initialValue]);

  const handleReset = () => {
    setSelectedItems([]);
    onChange([]);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="w-full justify-between font-normal text-muted-foreground"
          disabled={isLoading || disabled}
          role="combobox"
          variant="outline"
        >
          {selectedItems.length > 0
            ? `${selectedItems.length} ${t('general.selected')}`
            : t('general.select_licenses')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="popover-content-width-full w-full p-0">
        <Command
          filter={(value, search) => {
            const item = licenses.find((license) => license.id === value);
            return item?.name.toLowerCase().includes(search.toLowerCase())
              ? 1
              : 0;
          }}
        >
          <div className="flex w-full items-center border-b px-3">
            <CommandInput
              placeholder={t('dashboard.licenses.search_license')}
              value={searchQuery}
              disableBorder
              onValueChange={setSearchQuery}
            />
            {selectedItems.length > 0 && (
              <Button
                className="h-8 px-2"
                variant="ghost"
                onClick={handleReset}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CommandEmpty>{t('general.no_results')}</CommandEmpty>
          <CommandGroup>
            <CommandList>
              {isLoading ? (
                <CommandItem>
                  <div className="flex w-full items-center justify-center">
                    <LoadingSpinner />
                  </div>
                </CommandItem>
              ) : (
                filteredLicenses.map((license) => (
                  <CommandItem
                    key={license.id}
                    value={license.id}
                    onSelect={() => handleSelect(license.id)}
                  >
                    <Checkbox
                      checked={selectedItems.includes(license.id)}
                      className="mr-2"
                      onCheckedChange={() => handleSelect(license.id)}
                      onClick={(e) => e.preventDefault()}
                    />
                    <p>{highlightText(license.name, debouncedSearchQuery)}</p>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedItems.includes(license.id)
                          ? 'opacity-100'
                          : 'opacity-0',
                      )}
                    />
                  </CommandItem>
                ))
              )}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
};
