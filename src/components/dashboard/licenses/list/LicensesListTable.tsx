'use client';
import {
  ILicensesGetResponse,
  ILicensesGetSuccessResponse,
} from '@/app/api/(dashboard)/licenses/route';
import { DateConverter } from '@/components/shared/DateConverter';
import { CustomersAutocomplete } from '@/components/shared/form/CustomersAutocomplete';
import { ProductsAutocomplete } from '@/components/shared/form/ProductsAutocomplete';
import TablePagination from '@/components/shared/table/TablePagination';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTableScroll } from '@/hooks/useTableScroll';
import {
  getLicenseStatus,
  getLicenseStatusBadgeVariant,
} from '@/lib/utils/license-helpers';
import { cn } from '@/lib/utils/tailwind-helpers';
import { ArrowDownUp, Clock, Filter, Key, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddLicenseButton from './AddLicenseButton';
import { LicensesActionDropdown } from './LicensesActionDropdown';
import MobileFiltersModal from './LicensesMobileFiltersModal';

export function LicensesListTable() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const { showDropdown, containerRef } = useTableScroll();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
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

  return (
    <>
      <MobileFiltersModal
        customerIds={customerIds}
        open={mobileFiltersOpen}
        productIds={productIds}
        search={search}
        setCustomerIds={setCustomerIds}
        setProductIds={setProductIds}
        setSearch={setSearch}
        onOpenChange={setMobileFiltersOpen}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.licenses')}
            <div className="ml-auto flex gap-2">
              <Button
                className="lg:hidden"
                size="sm"
                variant="outline"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <AddLicenseButton />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalLicenses ? (
            <>
              <div className="mb-4 flex items-center gap-4 max-lg:hidden max-lg:flex-col">
                <div className="relative flex w-full items-center">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                  <Input
                    className="pl-8"
                    placeholder={t('dashboard.licenses.search_license')}
                    value={debounceSearch}
                    onChange={(e) => {
                      setDebounceSearch(e.target.value);
                    }}
                  />
                </div>
                <ProductsAutocomplete
                  productIds={productIds}
                  setProductIds={setProductIds}
                />
                <CustomersAutocomplete
                  customerIds={customerIds}
                  setCustomerIds={setCustomerIds}
                />
              </div>
              <div className="flex flex-col md:hidden">
                {loading
                  ? Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="group relative flex items-center justify-between border-b py-3 first:border-t"
                      >
                        <Skeleton className="h-10 w-full" />
                      </div>
                    ))
                  : licenses.map((license) => (
                      <Link
                        key={license.id}
                        className="group relative flex items-center justify-between border-b py-3 first:border-t"
                        href={`/dashboard/licenses/${license.id}`}
                      >
                        <div className="absolute inset-0 -mx-2 rounded-lg transition-colors group-hover:bg-secondary/80" />
                        <div className="z-10">
                          <p className="font-medium">{`${license.licenseKey}`}</p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <div className="text-xs text-muted-foreground">
                              <DateConverter date={license.createdAt} />
                            </div>
                          </div>
                        </div>
                        <div className="z-10 flex items-center space-x-2">
                          <span className="rounded-full px-2 py-1 text-xs font-medium">
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
                          </span>
                          <LicensesActionDropdown license={license} />
                        </div>
                      </Link>
                    ))}
              </div>
              <Table
                className="relative max-md:hidden"
                containerRef={containerRef}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="truncate">
                      {t('general.license')}
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
                            sortColumn === 'createdAt' &&
                              sortDirection === 'asc'
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
                            sortColumn === 'updatedAt' &&
                              sortDirection === 'asc'
                              ? 'desc'
                              : 'asc',
                          );
                        }}
                      >
                        {t('general.updated_at')}
                        <ArrowDownUp className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead
                      className={cn(
                        'sticky right-0 w-[50px] truncate px-2 text-right',
                        {
                          'bg-background drop-shadow-md': showDropdown,
                        },
                      )}
                    />
                  </TableRow>
                </TableHeader>
                {loading ? (
                  <TableSkeleton columns={8} rows={7} />
                ) : (
                  <TableBody>
                    {licenses.map((license) => (
                      <TableRow
                        key={license.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/licenses/${license.id}`)
                        }
                      >
                        <TableCell className="truncate">
                          {license.licenseKey}
                        </TableCell>
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
                              ? new Date(license.expirationDate).toLocaleString(
                                  locale,
                                )
                              : t('dashboard.licenses.never')
                          }
                        >
                          {license.expirationDate ? (
                            <DateConverter date={license.expirationDate} />
                          ) : (
                            t('dashboard.licenses.never')
                          )}
                        </TableCell>
                        <TableCell className="truncate">
                          {license.customers.length}
                        </TableCell>
                        <TableCell className="truncate">
                          {license.products.length}
                        </TableCell>
                        <TableCell
                          className="truncate"
                          title={new Date(license.createdAt).toLocaleString(
                            locale,
                          )}
                        >
                          <DateConverter date={license.createdAt} />
                        </TableCell>
                        <TableCell
                          className="truncate"
                          title={new Date(license.updatedAt).toLocaleString(
                            locale,
                          )}
                        >
                          <DateConverter date={license.updatedAt} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'sticky right-0 w-[50px] truncate px-2 py-0 text-right',
                            {
                              'bg-background drop-shadow-md': showDropdown,
                            },
                          )}
                        >
                          <LicensesActionDropdown license={license} />
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
                  <AddLicenseButton displayText />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
