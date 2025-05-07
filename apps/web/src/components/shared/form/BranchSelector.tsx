import { IProductsBranchesGetResponse } from '@/app/api/(dashboard)/products/branches/route';
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
import { TeamContext } from '@/providers/TeamProvider';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { LoadingSpinner } from '../LoadingSpinner';

interface BranchSelectProps {
  productId: string | null;
  onChange: (branchId: string | null) => void;
  initialValue?: string | null;
}

const fetchBranches = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as IProductsBranchesGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

export const BranchSelector = ({
  productId,
  onChange,
  initialValue,
}: BranchSelectProps) => {
  const t = useTranslations();
  const teamCtx = useContext(TeamContext);
  const [open, setOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');

  const searchParams = useMemo(() => {
    const params = new URLSearchParams({
      pageSize: '25',
      search: debouncedSearchQuery,
    });
    if (productId) {
      params.set('productId', productId);
    }
    return params;
  }, [debouncedSearchQuery, productId]);

  const { data, isLoading, error } = useSWR<IProductsBranchesGetResponse>(
    teamCtx.selectedTeam && productId
      ? [
          '/api/products/branches',
          teamCtx.selectedTeam,
          searchParams.toString(),
        ]
      : null,
    ([url, _, params]) => fetchBranches(`${url}?${params}`),
  );

  const branches = useMemo(() => {
    if (!data || 'message' in data) return [];
    return data.branches.map((branch) => ({
      name: branch.name,
      id: branch.id,
    }));
  }, [data]);

  useEffect(() => {
    if (error) {
      toast.error(error.message ?? t('general.server_error'));
    }
  }, [error, t]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    setSelectedItem(initialValue ?? null);
  }, [initialValue]);

  const filteredBranches = useMemo(
    () =>
      branches.filter((branch) =>
        branch.name.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    [searchQuery, branches],
  );

  const selectedBranch = useMemo(
    () => branches.find((branch) => branch.id === selectedItem),
    [branches, selectedItem],
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
    (branchId: string) => {
      setSelectedItem(branchId);
      onChange(branchId);
      setOpen(false);
    },
    [onChange],
  );

  const handleReset = () => {
    setSelectedItem(null);
    onChange(null);
  };

  if (error) {
    return <div>{t('general.error')}</div>;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn('w-full justify-between font-normal', {
            'text-muted-foreground': !selectedBranch,
          })}
          disabled={isLoading || !productId}
          role="combobox"
          variant="outline"
        >
          {selectedBranch ? selectedBranch.name : t('general.select_branch')}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="popover-content-width-full w-full p-0">
        <Command
          filter={(value, search) => {
            const item = branches.find((branch) => branch.id === value);
            return item?.name.toLowerCase().includes(search.toLowerCase())
              ? 1
              : 0;
          }}
        >
          <div className="flex w-full items-center border-b">
            <CommandInput
              placeholder={t('dashboard.releases.search_branch')}
              value={searchQuery}
              disableBorder
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
              {isLoading ? (
                <CommandItem>
                  <div className="flex w-full items-center justify-center">
                    <LoadingSpinner />
                  </div>
                </CommandItem>
              ) : (
                filteredBranches.map((branch) => (
                  <CommandItem
                    key={branch.id}
                    value={branch.id}
                    onSelect={() => handleSelect(branch.id)}
                  >
                    <p>{highlightText(branch.name, debouncedSearchQuery)}</p>
                    <Check
                      className={cn(
                        'ml-auto h-4 w-4',
                        selectedItem === branch.id
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
