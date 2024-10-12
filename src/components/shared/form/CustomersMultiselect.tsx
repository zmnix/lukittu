'use client';
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
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { LoadingSpinner } from '../LoadingSpinner';

interface CustomersMultiselectProps {
  onChange: (customerIds: string[]) => void;
  initialValue?: string[];
}

export const CustomersMultiselect = ({
  onChange,
  initialValue,
}: CustomersMultiselectProps) => {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [customers, setCustomers] = useState<
    {
      id: string;
      fullName: string | null;
      email: string | null;
    }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const handleFetchCustomers = useCallback(async () => {
    const response = await fetch(
      `/api/customers?search=${debouncedSearchQuery}&pageSize=25`,
    );
    const data = (await response.json()) as ICustomersGetResponse;

    if ('message' in data) {
      toast.error(data.message);
      return [];
    }

    const results = data.customers.map((customer) => ({
      fullName: customer.fullName,
      email: customer.email,
      id: customer.id,
    }));

    return results;
  }, [debouncedSearchQuery]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    if (initialValue?.length) {
      setSelectedItems(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (open) {
      (async () => {
        setLoading(true);
        try {
          const results = await handleFetchCustomers();
          setCustomers(results);
        } catch (error: any) {
          toast.error(error.message ?? t('general.error'));
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, debouncedSearchQuery, handleFetchCustomers, onChange, t]);

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (customer) =>
          customer.fullName
            ?.toLowerCase()
            .includes(searchQuery.toLowerCase()) ||
          customer.email?.toLowerCase().includes(searchQuery.toLowerCase()),
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
      setSelectedItems((current) => {
        if (current.includes(customerId)) {
          const newSelected = current.filter((i) => i !== customerId);
          onChange(newSelected);
          return newSelected;
        } else {
          const newSelected = [...current, customerId];
          onChange(newSelected);
          return newSelected;
        }
      });
    },
    [onChange],
  );

  const handleReset = () => {
    setSelectedItems([]);
    onChange([]);
  };
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className="w-full justify-between font-normal text-muted-foreground"
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
              item?.email?.toLowerCase().includes(search.toLowerCase())
              ? 1
              : 0;
          }}
        >
          <div className="flex items-center border-b px-3">
            <CommandInput
              placeholder={t('general.search_customer')}
              value={searchQuery}
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
              {loading ? (
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
                        `${customer.fullName ?? 'N/A'} - ${customer.email ?? 'N/A'}`,
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
