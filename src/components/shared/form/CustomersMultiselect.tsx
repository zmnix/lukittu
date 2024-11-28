import { ICustomersGetResponse } from '@/app/api/(dashboard)/customers/route';
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

interface CustomersMultiselectProps {
  onChange: (customerIds: string[]) => void;
  initialValue?: string[];
}

const fetchCustomers = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as ICustomersGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

export const CustomersMultiselect = ({
  onChange,
  initialValue = [],
}: CustomersMultiselectProps) => {
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

  const { data, isLoading, error } = useSWR<ICustomersGetResponse>(
    teamCtx.selectedTeam
      ? ['/api/customers', teamCtx.selectedTeam, searchParams.toString()]
      : null,
    ([url, _, params]) => fetchCustomers(`${url}?${params}`),
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

  const customers = useMemo(() => {
    if (!data || 'message' in data) return [];
    return data.customers.map((customer) => ({
      id: customer.id,
      fullName: customer.fullName,
      email: customer.email,
    }));
  }, [data]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.fullName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          customer.email.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, customers],
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
    (customerId: string) => {
      const currentSelected = [...selectedItems];
      if (currentSelected.includes(customerId)) {
        onChange(currentSelected.filter((i) => i !== customerId));
      } else {
        const newSelected = [...currentSelected, customerId];
        setSelectedItems(newSelected);
        onChange(newSelected);
      }
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
    <Popover open={open} modal onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="w-full justify-between font-normal text-muted-foreground"
          disabled={isLoading}
          role="combobox"
          variant="outline"
        >
          {selectedItems.length > 0
            ? `${selectedItems.length} ${t('general.selected')}`
            : t('general.select_customers')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="popover-content-width-full w-full p-0">
        <Command
          filter={(value, search) => {
            const item = customers.find((customer) => customer.id === value);
            return item?.fullName
              ?.toLowerCase()
              .includes(search.toLowerCase()) ||
              item?.email.toLowerCase().includes(search.toLowerCase())
              ? 1
              : 0;
          }}
        >
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder={t('general.search_customer')}
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
                filteredCustomers.map((customer) => (
                  <CommandItem
                    key={customer.id}
                    value={customer.id}
                    onSelect={() => handleSelect(customer.id)}
                  >
                    <Checkbox
                      checked={selectedItems.includes(customer.id)}
                      className="mr-2"
                      onCheckedChange={() => handleSelect(customer.id)}
                      onClick={(e) => e.preventDefault()}
                    />
                    <p>
                      {highlightText(
                        `${customer.fullName ?? 'N/A'} - ${customer.email}`,
                        debouncedSearchQuery,
                      )}
                    </p>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedItems.includes(customer.id)
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
