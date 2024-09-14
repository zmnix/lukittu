'use client';
import {
  ILicensesGetResponse,
  ILicensesGetSuccessResponse,
} from '@/app/api/(dashboard)/licenses/route';
import { CustomersAutocomplete } from '@/components/shared/form/CustomersAutocomplete';
import { ProductsAutocomplete } from '@/components/shared/form/ProductsAutocomplete';
import TablePagination from '@/components/shared/table/TablePagination';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
import { Badge } from '@/components/ui/badge';
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
import {
  getLicenseStatus,
  getLicenseStatusBadgeVariant,
} from '@/lib/utils/license-helpers';
import { LicenseModalContext } from '@/providers/LicenseModalProvider';
import {
  ArrowDownUp,
  Copy,
  Edit,
  Ellipsis,
  Filter,
  Key,
  Search,
  Trash,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddLicenseButton from './AddLicenseButton';
import MobileFiltersModal from './LicensesMobileFiltersModal';

export function LicensesListTable() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const ctx = useContext(LicenseModalContext);

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

  const handleCopy = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast.success(t('general.copied_to_clipboard'));
  };

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
              <AddLicenseButton />
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
          {totalLicenses ? (
            <>
              <div className="mb-4 flex items-center gap-4 max-lg:hidden max-lg:flex-col">
                <div className="relative flex w-full items-center">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                  <Input
                    className="wf pl-8"
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
                              : 'Never'
                          }
                        >
                          {license.expirationDate
                            ? new Date(license.expirationDate).toLocaleString(
                                locale,
                                {
                                  day: 'numeric',
                                  month: 'long',
                                  year: 'numeric',
                                },
                              )
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
                          title={new Date(license.createdAt).toLocaleString(
                            locale,
                          )}
                        >
                          {new Date(license.createdAt).toLocaleString(locale, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
                        </TableCell>
                        <TableCell
                          className="truncate"
                          title={new Date(license.updatedAt).toLocaleString(
                            locale,
                          )}
                        >
                          {new Date(license.updatedAt).toLocaleString(locale, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                          })}
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
                                  handleCopy(license.licenseKey);
                                }}
                              >
                                <Copy className="mr-2 h-4 w-4" />
                                {t('general.click_to_copy')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="hover:cursor-pointer"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  ctx.setLicenseToEdit(license);
                                  ctx.setLicenseModalOpen(true);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                {t('dashboard.licenses.edit_license')}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive hover:cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                {t('dashboard.licenses.delete_license')}
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
          )}
        </CardContent>
      </Card>
    </>
  );
}
