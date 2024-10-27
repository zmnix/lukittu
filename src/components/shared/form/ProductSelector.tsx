import { IProductsGetResponse } from '@/app/api/(dashboard)/products/route';
import { Button } from '@/components/ui/button';
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

interface ProductSelectProps {
  onChange: (productId: string | null) => void;
  initialValue?: string;
}

export const ProductSelector = ({
  onChange,
  initialValue,
}: ProductSelectProps) => {
  const t = useTranslations();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [products, setProducts] = useState<{ name: string; id: string }[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const handleFetchProducts = useCallback(async () => {
    const response = await fetch(
      `/api/products?search=${debouncedSearchQuery}&pageSize=25`,
    );
    const data = (await response.json()) as IProductsGetResponse;

    if ('message' in data) {
      toast.error(data.message);
      return [];
    }

    const results = data.products.map((product) => ({
      name: product.name,
      id: product.id,
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
    if (initialValue) {
      setSelectedItem(initialValue);
    }
  }, [initialValue]);

  useEffect(() => {
    if (open) {
      (async () => {
        setLoading(true);
        try {
          const results = await handleFetchProducts();
          setProducts(results);
        } catch (error: any) {
          toast.error(error.message ?? t('general.error'));
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [open, debouncedSearchQuery, handleFetchProducts, t]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, products],
  );

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedItem),
    [products, selectedItem],
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
      setSelectedItem(productId);
      onChange(productId);
      setOpen(false);
    },
    [onChange],
  );

  const handleReset = () => {
    setSelectedItem(null);
    onChange(null);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn('w-full justify-between font-normal', {
            'text-muted-foreground': !selectedProduct,
          })}
          role="combobox"
          variant="outline"
        >
          {selectedProduct ? selectedProduct.name : t('general.select_product')}
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
          <div className="flex w-full items-center border-b">
            <CommandInput
              placeholder={t('dashboard.licenses.search_product')}
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            {selectedItem && (
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
                filteredProducts.map((product) => (
                  <CommandItem
                    key={product.id}
                    value={product.id}
                    onSelect={() => handleSelect(product.id)}
                  >
                    <p>{highlightText(product.name, debouncedSearchQuery)}</p>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedItem === product.id
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
