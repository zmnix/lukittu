'use client';
import deleteProduct from '@/actions/products/delete-product';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useModal } from '@/hooks/useModal';
import { Product } from '@prisma/client';
import {
  ArrowDownUp,
  ArrowLeft,
  ArrowRight,
  ChevronsLeft,
  ChevronsRight,
  EllipsisVertical,
  Package,
  Plus,
  Search,
} from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { DeleteProductConfirmModal } from './ProductDeleteConfirmModal';
import SetProductModal from './SetProductModal';

interface ProductListProps {
  products: Product[];
  total: number;
  hasProducts: boolean;
}

interface SortableProps {
  pageSize?: number;
  page?: number;
  search?: string;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
}

export default function ProductsListCard({
  products: initialProducts,
  total,
  hasProducts,
}: ProductListProps) {
  const locale = useLocale();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations();

  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [debounceSearch, setDebounceSearch] = useState(
    searchParams.get('search') || '',
  );

  const { ConfirmModal, openConfirmModal } = useModal();

  const page = parseInt(searchParams.get('page') as string) || 1;
  const pageSize = parseInt(searchParams.get('pageSize') as string) || 25;
  const totalPages = Math.ceil(total / pageSize);

  const handleFilterChange = useCallback(
    ({ pageSize, page, search, sortColumn, sortDirection }: SortableProps) => {
      const currentPageSize = searchParams.get('pageSize');
      const currentPage = searchParams.get('page');
      const currentSearch = searchParams.get('search');
      const currentSortColumn = searchParams.get('sortColumn');
      const currentSortDirection = searchParams.get('sortDirection');

      if (
        currentPageSize !== pageSize?.toString() ||
        currentPage !== page?.toString() ||
        currentSearch !== search ||
        currentSortColumn !== sortColumn ||
        currentSortDirection !== sortDirection
      ) {
        const newSearchParams = new URLSearchParams(searchParams.toString());

        if (pageSize) {
          newSearchParams.set('pageSize', pageSize.toString());
        }

        if (page) {
          newSearchParams.set('page', page.toString());
        }

        if (search) {
          newSearchParams.set('search', search);
        } else {
          newSearchParams.delete('search');
        }

        if (sortColumn) {
          newSearchParams.set('sortColumn', sortColumn);
        }

        if (sortDirection) {
          newSearchParams.set('sortDirection', sortDirection);
        }

        router.replace(`/dashboard/products?${newSearchParams.toString()}`);
      }
    },
    [router, searchParams],
  );

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      handleFilterChange({
        search: debounceSearch,
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [debounceSearch, handleFilterChange, page, pageSize, router]);

  const handleProductDelete = async (
    product: Product,
    productNameConfirmation: string,
  ) => {
    const res = await deleteProduct(product.id, productNameConfirmation);

    if (res.isError) {
      return openConfirmModal({
        title: t('general.error'),
        description: res.message,
      });
    }

    setProducts((prevProducts) =>
      prevProducts.filter((p) => p.id !== product.id),
    );
  };

  return (
    <>
      <ConfirmModal />
      <SetProductModal
        open={productModalOpen}
        product={productToEdit}
        products={products}
        setProducts={setProducts}
        onClose={() => {
          setProductModalOpen(false);
        }}
      />
      <DeleteProductConfirmModal
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleProductDelete}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.products')}
            <Button
              className="ml-auto"
              size="sm"
              variant="default"
              onClick={() => {
                setProductToEdit(null);
                setProductModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.products.add_product')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
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
          {hasProducts ? (
            <>
              <Table>
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
                <TableBody>
                  {products.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="truncate">{product.name}</TableCell>
                      <TableCell
                        className="truncate"
                        title={new Date(product.createdAt).toLocaleString(
                          locale,
                        )}
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
                              onClick={() => {
                                setProductToEdit(product);
                                setProductModalOpen(true);
                              }}
                            >
                              {t('dashboard.products.edit_product')}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive hover:cursor-pointer"
                              onClick={() => setProductToDelete(product)}
                            >
                              {t('dashboard.products.delete_product')}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-end gap-4">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium">
                    {t('general.rows_per_page')}:
                  </p>
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
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setProductToEdit(null);
                      setProductModalOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('dashboard.products.add_product')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
