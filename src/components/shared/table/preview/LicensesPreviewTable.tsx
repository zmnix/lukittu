import {
  ILicensesGetResponse,
  ILicensesGetSuccessResponse,
} from '@/app/api/(dashboard)/licenses/route';
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
import { ArrowDownUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface LicensesPreviewTableProps {
  productId?: string;
  customerId?: string;
}
export default function LicensesPreviewTable({
  customerId,
  productId,
}: LicensesPreviewTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const [licenses, setLicenses] = useState<
    ILicensesGetSuccessResponse['licenses']
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'createdAt' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );
  const [totalLicenses, setTotalLicenses] = useState(1);

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

        if (productId) {
          searchParams.set('productIds', productId);
        }

        if (customerId) {
          searchParams.set('customerIds', customerId);
        }

        searchParams.set('page', page.toString());
        searchParams.set('pageSize', '10');

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
  }, [page, sortColumn, sortDirection, t, productId, customerId]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 border-b py-5">
        <CardTitle className="flex items-center text-xl font-bold">
          {t('dashboard.navigation.licenses')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {totalLicenses ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="truncate">
                    {t('dashboard.licenses.license')}
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
                </TableRow>
              </TableHeader>
              {loading ? (
                <TableSkeleton columns={2} rows={3} />
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
                      <TableCell>{license.licenseKey}</TableCell>
                      <TableCell>
                        {new Date(license.createdAt).toLocaleString(locale, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                          hour: 'numeric',
                          minute: 'numeric',
                        })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            <TablePagination
              page={page}
              pageSize={10}
              results={licenses.length}
              setPage={setPage}
              totalItems={totalLicenses}
              totalPages={Math.ceil(totalLicenses / 10)}
            />
          </>
        ) : (
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
            {t('dashboard.products.no_licenses_assigned')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
