'use client';
import {
  IProductsGetResponse,
  IProductsGetSuccessResponse,
} from '@/app/api/(dashboard)/products/route';
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
import { ArrowDownUp, Clock, Filter, Package, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddProductButton from './AddProductButton';
import { ProductsActionDropdown } from './ProductsActionDropdown';
import ProductsMobileFiltersModal from './ProductsMobileFiltersModal';

export function ProductListTable() {
  const locale = useLocale();
  const t = useTranslations();
  const router = useRouter();
  const { showDropdown, containerRef } = useTableScroll();

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<
    IProductsGetSuccessResponse['products']
  >([]);
  const [totalProducts, setTotalProducts] = useState(1);
  const [debounceSearch, setDebounceSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<
    'createdAt' | 'updatedAt' | 'name' | null
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
          `/api/products?${searchParams.toString()}`,
        );

        const data = (await response.json()) as IProductsGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setProducts(data.products);
        setTotalProducts(data.totalProducts);
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
      <ProductsMobileFiltersModal
        open={mobileFiltersOpen}
        search={debounceSearch}
        setSearch={setSearch}
        onOpenChange={setMobileFiltersOpen}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.products')}
            <div className="ml-auto flex gap-2">
              <Button
                className="lg:hidden"
                size="sm"
                variant="outline"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <AddProductButton />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalProducts ? (
            <>
              <div className="relative mb-4 flex min-w-[33%] max-w-xs items-center max-lg:hidden">
                <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
                <Input
                  className="pl-8"
                  placeholder="Search products"
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
                  : products.map((product) => (
                      <Link
                        key={product.id}
                        className="group relative flex items-center justify-between border-b py-3 first:border-t"
                        href={`/dashboard/products/${product.id}`}
                      >
                        <div className="absolute inset-0 -mx-2 rounded-lg transition-colors group-hover:bg-secondary/80" />
                        <div className="z-10">
                          <p className="font-medium">{`${product.name}`}</p>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                            <div className="text-xs text-muted-foreground">
                              <DateConverter date={product.createdAt} />
                            </div>
                          </div>
                        </div>
                        <div className="z-10 flex items-center space-x-2">
                          <ProductsActionDropdown product={product} />
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
                          setSortColumn('name');
                          setSortDirection(
                            sortColumn === 'name' && sortDirection === 'asc'
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
                  <TableSkeleton columns={4} rows={6} />
                ) : (
                  <TableBody>
                    {products.map((product) => (
                      <TableRow
                        key={product.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/products/${product.id}`)
                        }
                      >
                        <TableCell className="truncate">
                          {product.name}
                        </TableCell>
                        <TableCell
                          className="truncate"
                          title={new Date(product.createdAt).toLocaleString(
                            locale,
                          )}
                        >
                          <DateConverter date={product.createdAt} />
                        </TableCell>
                        <TableCell
                          className="truncate"
                          title={new Date(product.updatedAt).toLocaleString(
                            locale,
                          )}
                        >
                          <DateConverter date={product.updatedAt} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'sticky right-0 w-[50px] truncate px-2 py-0 text-right',
                            {
                              'bg-background drop-shadow-md': showDropdown,
                            },
                          )}
                        >
                          <ProductsActionDropdown product={product} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <TablePagination
                page={page}
                pageSize={pageSize}
                results={products.length}
                setPage={setPage}
                setPageSize={setPageSize}
                totalItems={totalProducts}
                totalPages={Math.ceil(totalProducts / pageSize)}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4">
                <div className="flex">
                  <span className="rounded-lg bg-secondary p-4">
                    <Package className="h-6 w-6" />
                  </span>
                </div>
                <h3 className="text-lg font-bold">
                  {t('dashboard.products.add_your_first_product')}
                </h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  {t('dashboard.products.product_description')}
                </p>
                <div>
                  <AddProductButton displayText />
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
