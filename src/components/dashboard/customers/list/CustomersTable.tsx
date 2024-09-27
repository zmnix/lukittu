'use client';
import {
  ICustomersGetResponse,
  ICustomersGetSuccessResponse,
} from '@/app/api/(dashboard)/customers/route';
import { DateConverter } from '@/components/shared/DateConverter';
import TablePagination from '@/components/shared/table/TablePagination';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
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
import { cn } from '@/lib/utils/tailwind-helpers';
import { CustomerModalProvider } from '@/providers/CustomerModalProvider';
import { ArrowDownUp, Clock, Filter, Search, Users } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddCustomerButton from './AddCustomerButton';
import { CustomersActionDropdown } from './CustomersActionDropdown';
import CustomersMobileFiltersModal from './CustomersMobileFilters';

export function CustomersTable() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const { showDropdown, containerRef } = useTableScroll();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<
    ICustomersGetSuccessResponse['customers']
  >([]);
  const [totalCustomers, setTotalCustomers] = useState(1);
  const [debounceSearch, setDebounceSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<
    'createdAt' | 'updatedAt' | 'fullName' | 'email' | null
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

        searchParams.set('page', page.toString());
        searchParams.set('pageSize', pageSize.toString());

        const response = await fetch(
          `/api/customers?${searchParams.toString()}`,
        );

        const data = (await response.json()) as ICustomersGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setCustomers(data.customers);
        setTotalCustomers(data.totalCustomers);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize, sortColumn, sortDirection, search, t]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(debounceSearch);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [debounceSearch]);

  return (
    <CustomerModalProvider>
      <CustomersMobileFiltersModal
        open={mobileFiltersOpen}
        search={debounceSearch}
        setSearch={setSearch}
        onOpenChange={setMobileFiltersOpen}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.customers')}
            <div className="ml-auto flex gap-2">
              <Button
                className="lg:hidden"
                size="sm"
                variant="outline"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <AddCustomerButton />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalCustomers ? (
            <>
              <div className="relative mb-4 flex min-w-[33%] max-w-xs items-center max-lg:hidden">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  className="pl-8"
                  placeholder={t('dashboard.customers.search_customer')}
                  value={debounceSearch}
                  onChange={(e) => {
                    setDebounceSearch(e.target.value);
                  }}
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
                  : customers.map((customer) => (
                      <Link
                        key={customer.id}
                        className="group relative flex items-center justify-between border-b py-3 first:border-t"
                        href={`/dashboard/customers/${customer.id}`}
                        tabIndex={0}
                      >
                        <div className="absolute inset-0 -mx-2 rounded-lg transition-colors group-hover:bg-secondary/80" />
                        <div className="z-10">
                          <p className="line-clamp-2 font-medium">
                            {customer.fullName ?? t('general.unknown')}
                          </p>
                          <div className="mb-1 line-clamp-1 break-all text-xs font-semibold text-muted-foreground">
                            {customer.email ?? t('general.unknown')}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <div className="text-xs text-muted-foreground">
                              <DateConverter date={customer.createdAt} />
                            </div>
                          </div>
                        </div>
                        <div className="z-10 flex items-center space-x-2">
                          <CustomersActionDropdown customer={customer} />
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
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSortColumn('fullName');
                          setSortDirection(
                            sortColumn === 'fullName' && sortDirection === 'asc'
                              ? 'desc'
                              : 'asc',
                          );
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
                          setSortColumn('email');
                          setSortDirection(
                            sortColumn === 'email' && sortDirection === 'asc'
                              ? 'desc'
                              : 'asc',
                          );
                        }}
                      >
                        {t('general.email')}
                        <ArrowDownUp className="ml-2 h-4 w-4" />
                      </Button>
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
                  <TableSkeleton columns={5} rows={6} />
                ) : (
                  <TableBody>
                    {customers.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/customers/${customer.id}`)
                        }
                      >
                        <TableCell className="truncate">
                          {customer.fullName ?? 'N/A'}
                        </TableCell>
                        <TableCell className="truncate">
                          {customer.email ?? 'N/A'}
                        </TableCell>
                        <TableCell
                          className="truncate"
                          title={new Date(customer.createdAt).toLocaleString(
                            locale,
                          )}
                        >
                          <DateConverter date={customer.createdAt} />
                        </TableCell>
                        <TableCell
                          className="truncate"
                          title={new Date(customer.updatedAt).toLocaleString(
                            locale,
                          )}
                        >
                          <DateConverter date={customer.updatedAt} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'sticky right-0 w-[50px] truncate px-2 py-0 text-right',
                            {
                              'bg-background drop-shadow-md': showDropdown,
                            },
                          )}
                        >
                          <CustomersActionDropdown customer={customer} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <TablePagination
                page={page}
                pageSize={pageSize}
                results={customers.length}
                setPage={setPage}
                setPageSize={setPageSize}
                totalItems={totalCustomers}
                totalPages={Math.ceil(totalCustomers / pageSize)}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4">
                <div className="flex">
                  <span className="rounded-lg bg-secondary p-4">
                    <Users className="h-6 w-6" />
                  </span>
                </div>
                <h3 className="text-lg font-bold">
                  {t('dashboard.customers.add_your_first_customer')}
                </h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  {t('dashboard.customers.customer_description')}
                </p>
                <div>
                  <AddCustomerButton displayText />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </CustomerModalProvider>
  );
}
