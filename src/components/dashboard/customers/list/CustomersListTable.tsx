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
import { CustomerModalContext } from '@/providers/CustomerModalProvider';
import {
  ArrowDownUp,
  Edit,
  Ellipsis,
  Filter,
  Search,
  Trash,
  Users,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddCustomerButton from './AddCustomerButton';
import CustomersMobileFiltersModal from './CustomersMobileFilters';

export function CustomersListTable() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const ctx = useContext(CustomerModalContext);

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
    <>
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
              <AddCustomerButton />
              <Button
                className="lg:hidden"
                size="sm"
                variant="outline"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
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
              <Table>
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
                    <TableHead className="truncate text-right">
                      {t('general.actions')}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                {loading ? (
                  <TableSkeleton columns={4} rows={6} />
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
                        <TableCell className="truncate py-0 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="icon" variant="ghost">
                                <Ellipsis className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="end"
                              className="font-medium"
                              forceMount
                            >
                              <DropdownMenuItem
                                className="hover:cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  ctx.setCustomerToEdit(customer);
                                  ctx.setCustomerModalOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('dashboard.customers.edit_customer')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive hover:cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  ctx.setCustomerToDelete(customer);
                                  ctx.setCustomerToDeleteModalOpen(true);
                                }}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                {t('dashboard.customers.delete_customer')}
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
                  <AddCustomerButton />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
