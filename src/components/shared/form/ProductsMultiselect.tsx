import { IProductsGetResponse } from '@/app/api/(dashboard)/products/route';
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

const fetchProducts = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as IProductsGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

interface ProductsMultiselectProps {
  onChange: (productIds: string[]) => void;
  initialValue?: string[];
}

export const ProductsMultiselect = ({
  onChange,
  initialValue = [],
}: ProductsMultiselectProps) => {
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

  const { data, isLoading, error } = useSWR<IProductsGetResponse>(
    teamCtx.selectedTeam
      ? ['/api/products', teamCtx.selectedTeam, searchParams.toString()]
      : null,
    ([url, _, params]) => fetchProducts(`${url}?${params}`),
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

  const products = useMemo(() => {
    if (!data || 'message' in data) return [];
    return data.products.map((product) => ({
      name: product.name,
      id: product.id,
    }));
  }, [data]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, products],
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
    (productId: string) => {
      const currentSelected = [...selectedItems];
      if (currentSelected.includes(productId)) {
        onChange(currentSelected.filter((i) => i !== productId));
      } else {
        const newSelected = [...currentSelected, productId];
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
            : t('general.select_products')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="popover-content-width-full w-full p-0">
        <Command
          filter={(value, search) => {
            const item = products.find((product) => product.id === value);

            return item?.name.toLowerCase().includes(search.toLowerCase())
              ? 1
              : 0;
          }}
        >
          <div className="flex w-full items-center border-b px-3">
            <CommandInput
              placeholder={t('dashboard.licenses.search_product')}
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
                filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelect(product.id)}
                  >
                    <Checkbox
                      checked={selectedItems.includes(product.id)}
                      className="mr-2"
                      onCheckedChange={() => handleSelect(product.id)}
                      onClick={(e) => e.preventDefault()}
                    />
                    <p>{highlightText(product.name, debouncedSearchQuery)}</p>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedItems.includes(product.id)
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
