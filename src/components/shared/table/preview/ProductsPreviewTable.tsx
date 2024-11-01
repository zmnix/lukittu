import {
  IProductsGetResponse,
  IProductsGetSuccessResponse,
} from '@/app/api/(dashboard)/products/route';
import TablePagination from '@/components/shared/table/TablePagination';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ProductModalProvider } from '@/providers/ProductModalProvider';
import { ArrowDownUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DateConverter } from '../../DateConverter';
import AddEntityButton from '../../misc/AddEntityButton';

interface ProductsPreviewTableProps {
  licenseId: string;
}
export default function ProductsPreviewTable({
  licenseId,
}: ProductsPreviewTableProps) {
  const t = useTranslations();
  const router = useRouter();

  const [products, setProducts] = useState<
    IProductsGetSuccessResponse['products']
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'createdAt' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );
  const [totalProducts, setTotalProducts] = useState(1);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const searchParams = new URLSearchParams({
          page: page.toString(),
          pageSize: '10',
          ...(sortColumn && { sortColumn }),
          ...(sortDirection && { sortDirection }),
          ...(licenseId && { licenseId }),
        });

        const response = await fetch(
          `/api/products?${searchParams.toString()}`,
        );

        const data = (await response.json()) as IProductsGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setProducts(data.products);
        setTotalProducts(data.totalResults);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, sortColumn, sortDirection, t, licenseId]);

  return (
    <ProductModalProvider>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2 border-b py-5">
          <CardTitle className="flex w-full items-center text-xl font-bold">
            {t('dashboard.navigation.products')}
            <div className="ml-auto flex gap-2">
              <AddEntityButton entityType="product" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {totalProducts ? (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="truncate">
                      {t('general.name')}
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
                  </TableRow>
                </TableHeader>
                {loading ? (
                  <TableSkeleton columns={2} rows={3} />
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
                        <TableCell>{product.name}</TableCell>
                        <TableCell>
                          <DateConverter date={product.createdAt} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <TablePagination
                page={page}
                pageSize={10}
                results={products.length}
                setPage={setPage}
                totalItems={totalProducts}
                totalPages={Math.ceil(totalProducts / 10)}
              />
            </>
          ) : (
            <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
              {t('dashboard.licenses.no_products_assigned')}
            </div>
          )}
        </CardContent>
      </Card>
    </ProductModalProvider>
  );
}
