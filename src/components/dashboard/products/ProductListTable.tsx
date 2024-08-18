'use client';
import { ProductsGetResponse } from '@/app/api/products/(get)/route';
import TablePagination from '@/components/shared/table/TablePagination';
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
import { ProductModalContext } from '@/providers/ProductModalProvider';
import { Product } from '@prisma/client';
import {
  ArrowDownUp,
  EllipsisVertical,
  Frown,
  Package,
  Search,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useContext, useEffect, useState } from 'react';
import AddProductButton from './AddProductButton';
import ProductListTableSkeleton from './ProductListTableSkeleton';

export function ProductListTable() {
  const locale = useLocale();
  const t = useTranslations();
  const ctx = useContext(ProductModalContext);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(1);
  const [debounceSearch, setDebounceSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [sortColumn, setSortColumn] = useState<'createdAt' | 'name' | null>(
    null,
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      setLoading(true);
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

        const data = (await response.json()) as ProductsGetResponse;

        if ('error' in data) {
          return setError(data.error);
        }

        if (!response.ok) {
          setError(t('auth.oauth.server_error'));
        }
        setProducts(data.products);
        setTotalProducts(data.totalProducts);
      } catch (error: any) {
        setError(t('auth.oauth.server_error'));
        console.error(error);
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize, sortColumn, sortDirection, search, t]);

  useEffect(() => {
    setLoading(true);
    const timeout = setTimeout(() => {
      setSearch(debounceSearch);
      setLoading(false);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [debounceSearch]);

  return totalProducts ? (
    <>
      <div className="relative mb-4 flex max-w-xs items-center max-sm:max-w-full">
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
      {error ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4">
            <div className="flex">
              <span className="rounded-lg bg-secondary p-4">
                <Frown className="h-6 w-6" />
              </span>
            </div>
            <h3 className="text-lg font-bold">{t('general.error')}</h3>
            <p className="max-w-sm text-center text-sm text-muted-foreground">
              {error}
            </p>
            <Button
              onClick={() => {
                setError(null);
              }}
            >
              {t('general.retry')}
            </Button>
          </div>
        </div>
      ) : (
        <Table>
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
              <TableHead className="truncate text-right">
                {t('general.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <ProductListTableSkeleton />
          ) : (
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="truncate">{product.name}</TableCell>
                  <TableCell
                    className="truncate"
                    title={new Date(product.createdAt).toLocaleString(locale)}
                  >
                    {new Date(product.createdAt).toLocaleString(locale, {
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
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          onClick={() => ctx.setProductModalOpen(true)}
                        >
                          {t('dashboard.products.edit_product')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive hover:cursor-pointer"
                          onClick={() => {
                            ctx.setProductToDelete(product);
                            ctx.setProductToDeleteModalOpen(true);
                          }}
                        >
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
      )}
      <TablePagination
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
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
          <AddProductButton />
        </div>
      </div>
    </div>
  );
}
