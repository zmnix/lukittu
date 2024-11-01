import {
  ILicensesGetResponse,
  ILicensesGetSuccessResponse,
} from '@/app/api/(dashboard)/licenses/route';
import { LicensesActionDropdown } from '@/components/dashboard/licenses/LicensesActionDropdown';
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
import { useTableScroll } from '@/hooks/useTableScroll';
import { cn } from '@/lib/utils/tailwind-helpers';
import { LicenseModalProvider } from '@/providers/LicenseModalProvider';
import { ArrowDownUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DateConverter } from '../../DateConverter';
import AddEntityButton from '../../misc/AddEntityButton';

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
  const { showDropdown, containerRef } = useTableScroll();

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
      setLoading(true);
      try {
        const searchParams = new URLSearchParams({
          page: page.toString(),
          pageSize: '10',
          ...(sortColumn && { sortColumn }),
          ...(sortDirection && { sortDirection }),
          ...(productId && { productId }),
          ...(customerId && { customerId }),
        });

        const response = await fetch(
          `/api/licenses?${searchParams.toString()}`,
        );

        const data = (await response.json()) as ILicensesGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setLicenses(data.licenses);
        setTotalLicenses(data.totalResults);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, sortColumn, sortDirection, t, productId, customerId]);

  return (
    <LicenseModalProvider>
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center gap-2 border-b py-5">
          <CardTitle className="flex w-full items-center text-xl font-bold">
            {t('dashboard.navigation.licenses')}
            <div className="ml-auto flex gap-2">
              <AddEntityButton entityType="license" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
          {totalLicenses ? (
            <>
              <Table
                className="relative"
                containerRef={containerRef as React.RefObject<HTMLDivElement>}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="truncate">
                      {t('general.license')}
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
                  <TableSkeleton columns={3} rows={3} />
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
                          <DateConverter date={license.createdAt} />
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
    </LicenseModalProvider>
  );
}
