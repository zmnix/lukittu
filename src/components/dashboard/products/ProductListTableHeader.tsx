'use client';
import { Button } from '@/components/ui/button';
import { TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowDownUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

export default function ProductListTableHeader() {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();

  const handleFilterChange = ({
    sortColumn,
    sortDirection,
  }: {
    sortColumn: string;
    sortDirection: 'asc' | 'desc';
  }) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    newSearchParams.set('sortColumn', sortColumn);
    newSearchParams.set('sortDirection', sortDirection);

    router.replace(`?${newSearchParams.toString()}`);
  };

  return (
    <TableHeader>
      <TableRow>
        <TableHead className="truncate">
          <Button
            variant="ghost"
            onClick={() => {
              handleFilterChange({
                sortColumn: 'name',
                sortDirection:
                  searchParams.get('sortColumn') === 'name' &&
                  searchParams.get('sortDirection') === 'asc'
                    ? 'desc'
                    : 'asc',
              });
            }}
          >
            {t('general.name')}
            <ArrowDownUp className="ml-2 h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead className="truncate">
          <Button
            variant="ghost"
            onClick={() => {
              handleFilterChange({
                sortColumn: 'createdAt',
                sortDirection:
                  searchParams.get('sortColumn') === 'createdAt' &&
                  searchParams.get('sortDirection') === 'asc'
                    ? 'desc'
                    : 'asc',
              });
            }}
          >
            {t('general.created_at')}
            <ArrowDownUp className="ml-2 h-4 w-4" />
          </Button>
        </TableHead>
        <TableHead className="truncate text-right">
          {t('general.actions')}
        </TableHead>
      </TableRow>
    </TableHeader>
  );
}
