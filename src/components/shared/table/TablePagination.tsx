'use client';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';

interface TablePaginationProps {
  totalPages: number;
}

export default function TablePagination({ totalPages }: TablePaginationProps) {
  const t = useTranslations();
  const searchParams = useSearchParams();
  const router = useRouter();

  let page = parseInt(searchParams.get('page') as string) || 1;
  let pageSize = parseInt(searchParams.get('pageSize') as string) || 25;

  if (page < 1) {
    page = 1;
  }

  if (![25, 50, 100].includes(pageSize)) {
    pageSize = 25;
  }

  const handleFilterChange = ({
    page,
    pageSize,
  }: {
    page?: number;
    pageSize?: number;
  }) => {
    const newSearchParams = new URLSearchParams(searchParams.toString());

    if (page) {
      newSearchParams.set('page', page.toString());
    }

    if (pageSize) {
      newSearchParams.set('pageSize', pageSize.toString());
    }

    router.replace(`?${newSearchParams.toString()}`);
  };

  return (
    <div className="mt-4 flex items-center justify-end gap-4">
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium">{t('general.rows_per_page')}:</p>
        <Select
          value={pageSize.toString()}
          onValueChange={(value) => {
            handleFilterChange({
              pageSize: parseInt(value),
            });
          }}
        >
          <SelectTrigger className="h-8 w-[70px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="25">25</SelectItem>
            <SelectItem value="50">50</SelectItem>
            <SelectItem value="100">100</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <p className="text-sm font-medium">
          {t('general.page_of', {
            page: page,
            pages: totalPages,
          })}
        </p>
      </div>
      <div className="flex items-center space-x-2">
        <Button
          className="hidden h-8 w-8 p-0 lg:flex"
          disabled={page === 1}
          variant="outline"
          onClick={() => {
            handleFilterChange({
              page: 1,
            });
          }}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          className="h-8 w-8 p-0"
          disabled={page === 1}
          variant="outline"
          onClick={() => {
            handleFilterChange({
              page: page - 1,
            });
          }}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Button
          className="h-8 w-8 p-0"
          disabled={page === totalPages}
          variant="outline"
          onClick={() => {
            handleFilterChange({
              page: page + 1,
            });
          }}
        >
          <ArrowRight className="h-4 w-4" />
        </Button>
        <Button
          className="hidden h-8 w-8 p-0 lg:flex"
          disabled={page === totalPages}
          variant="outline"
          onClick={() => {
            handleFilterChange({
              page: totalPages,
            });
          }}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
