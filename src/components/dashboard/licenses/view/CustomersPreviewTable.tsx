import {
  ICustomersGetResponse,
  ICustomersGetSuccessResponse,
} from '@/app/api/(dashboard)/customers/route';
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

interface CustomersPreviewTableProps {
  licenseId: string;
}
export default function CustomersPreviewTable({
  licenseId,
}: CustomersPreviewTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const [customers, SetCustomers] = useState<
    ICustomersGetSuccessResponse['customers']
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<
    'createdAt' | 'name' | 'email' | null
  >(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );
  const [totalCustomers, setTotalCustomers] = useState(1);

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

        if (licenseId) {
          searchParams.set('licenseId', licenseId);
        }

        searchParams.set('page', page.toString());
        searchParams.set('pageSize', '10');

        const response = await fetch(
          `/api/customers?${searchParams.toString()}`,
        );

        const data = (await response.json()) as ICustomersGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        SetCustomers(data.customers);
        setTotalCustomers(data.totalCustomers);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, sortColumn, sortDirection, t, licenseId]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 border-b py-5">
        <CardTitle className="flex items-center text-xl font-bold">
          {t('dashboard.navigation.customers')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {totalCustomers ? (
          <>
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
                <TableSkeleton columns={3} rows={3} />
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
                        {customer.fullName}
                      </TableCell>
                      <TableCell className="truncate">
                        {customer.email}
                      </TableCell>
                      <TableCell className="truncate">
                        {new Date(customer.createdAt).toLocaleString(locale, {
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
              results={customers.length}
              setPage={setPage}
              totalItems={totalCustomers}
              totalPages={Math.ceil(totalCustomers / 10)}
            />
          </>
        ) : (
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
            {t('dashboard.licenses.no_customers_assigned')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
