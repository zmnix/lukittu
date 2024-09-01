'use client';
import {
  ILicensesGetResponse,
  ILicensesGetSuccessResponse,
} from '@/app/api/(dashboard)/licenses/route';
import { CustomersAutocomplete } from '@/components/shared/form/CustomersAutocomplete';
import { ProductsAutocomplete } from '@/components/shared/form/ProductsAutocomplete';
import TablePagination from '@/components/shared/table/TablePagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  getLicenseStatus,
  getLicenseStatusBadgeVariant,
} from '@/lib/utils/license-helpers';
import { ArrowDownUp, EllipsisVertical, Key, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import ProductListTableSkeleton from '../../products/ProductListTableSkeleton';
import AddLicenseButton from './AddLicenseButton';

export function LicensesListTable() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [licenses, setLicenses] = useState<
    ILicensesGetSuccessResponse['licenses']
  >([]);
  const [totalLicenses, setTotalLicenses] = useState(1);
  const [debounceSearch, setDebounceSearch] = useState('');
  const [search, setSearch] = useState('');
  const [productIds, setProductIds] = useState<string[]>([]);
  const [customerIds, setCustomerIds] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<
    'createdAt' | 'updatedAt' | null
  >(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      try {
        const searchParams = new URLSearchParams();
        if (sortColumn) {
          searchParams.set('sortColumn', sortColumn);
        }

        if (sortDirection) {
          searchParams.set('sortDirection', sortDirection);
        }

        if (search) {
          searchParams.set('search', search);
        }

        if (productIds.length) {
          searchParams.set('productIds', productIds.join(','));
        }

        if (customerIds.length) {
          searchParams.set('customerIds', customerIds.join(','));
        }

        searchParams.set('page', page.toString());
        searchParams.set('pageSize', pageSize.toString());

        const response = await fetch(
          `/api/licenses?${searchParams.toString()}`,
        );

        const data = (await response.json()) as ILicensesGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setLicenses(data.licenses);
        setTotalLicenses(data.totalLicenses);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [
    page,
    pageSize,
    sortColumn,
    sortDirection,
    search,
    t,
    productIds,
    customerIds,
  ]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(debounceSearch);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [debounceSearch]);

  return totalLicenses ? (
    <>
      <div className="mb-4 flex items-center gap-4 max-lg:flex-col">
        <div className="relative flex w-full items-center">
          <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
          <Input
            className="wf pl-8"
            placeholder="Search licenses"
            value={debounceSearch}
            onChange={(e) => {
              setDebounceSearch(e.target.value);
            }}
          />
        </div>
        <ProductsAutocomplete setProductIds={setProductIds} />
        <CustomersAutocomplete setCustomerIds={setCustomerIds} />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="truncate">
              {t('dashboard.licenses.license')}
            </TableHead>
            <TableHead className="truncate">
              {t('dashboard.licenses.status')}
            </TableHead>
            <TableHead className="truncate">
              {t('dashboard.licenses.expires_at')}
            </TableHead>
            <TableHead className="truncate">
              {t('dashboard.navigation.customers')}
            </TableHead>
            <TableHead className="truncate">
              {t('dashboard.navigation.products')}
            </TableHead>
            <TableHead className="truncate">
              <Button
                variant="ghost"
                onClick={() => {
                  setSortColumn('createdAt');
                  setSortDirection(
                    sortColumn === 'createdAt' && sortDirection === 'asc'
                      ? 'desc'
                      : 'asc',
                  );
                }}
              >
                {t('general.created_at')}
                <ArrowDownUp className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="truncate">
              <Button
                variant="ghost"
                onClick={() => {
                  setSortColumn('updatedAt');
                  setSortDirection(
                    sortColumn === 'updatedAt' && sortDirection === 'asc'
                      ? 'desc'
                      : 'asc',
                  );
                }}
              >
                {t('general.updated_at')}
                <ArrowDownUp className="ml-2 h-4 w-4" />
              </Button>
            </TableHead>
            <TableHead className="truncate text-right">
              {t('general.actions')}
            </TableHead>
          </TableRow>
        </TableHeader>
        {loading ? (
          <ProductListTableSkeleton />
        ) : (
          <TableBody>
            {licenses.map((license) => (
              <TableRow
                key={license.id}
                className="cursor-pointer"
                onClick={() => router.push(`/dashboard/licenses/${license.id}`)}
              >
                <TableCell className="truncate">{license.licenseKey}</TableCell>
                <TableCell className="truncate">
                  <Badge
                    className="text-xs"
                    variant={getLicenseStatusBadgeVariant(
                      getLicenseStatus(license),
                    )}
                  >
                    {t(
                      `general.${getLicenseStatus(license).toLowerCase()}` as any,
                    )}
                  </Badge>
                </TableCell>
                <TableCell
                  className="truncate"
                  title={
                    license.expirationDate
                      ? new Date(license.expirationDate).toLocaleString(locale)
                      : 'Never'
                  }
                >
                  {license.expirationDate
                    ? new Date(license.expirationDate).toLocaleString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })
                    : 'Never'}
                </TableCell>
                <TableCell className="truncate">
                  {license.customers.length}
                </TableCell>
                <TableCell className="truncate">
                  {license.products.length}
                </TableCell>
                <TableCell
                  className="truncate"
                  title={new Date(license.createdAt).toLocaleString(locale)}
                >
                  {new Date(license.createdAt).toLocaleString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell
                  className="truncate"
                  title={new Date(license.updatedAt).toLocaleString(locale)}
                >
                  {new Date(license.updatedAt).toLocaleString(locale, {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell className="truncate py-0 text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button size="icon" variant="ghost">
                        <EllipsisVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="font-medium"
                      forceMount
                    >
                      <DropdownMenuItem className="hover:cursor-pointer">
                        {t('dashboard.products.edit_product')}
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive hover:cursor-pointer">
                        {t('dashboard.products.delete_product')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
      <TablePagination
        page={page}
        pageSize={pageSize}
        results={licenses.length}
        setPage={setPage}
        setPageSize={setPageSize}
        totalItems={totalLicenses}
        totalPages={Math.ceil(totalLicenses / pageSize)}
      />
    </>
  ) : (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4">
        <div className="flex">
          <span className="rounded-lg bg-secondary p-4">
            <Key className="h-6 w-6" />
          </span>
        </div>
        <h3 className="text-lg font-bold">
          {t('dashboard.licenses.add_your_first_license')}
        </h3>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {t('dashboard.licenses.license_description')}
        </p>
        <div>
          <AddLicenseButton />
        </div>
      </div>
    </div>
  );
}
