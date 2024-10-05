import {
  ILicenseHeartbeatsGetResponse,
  ILicenseHeartbeatsGetSuccessResponse,
} from '@/app/api/(dashboard)/heartbeats/route';
import { DateConverter } from '@/components/shared/DateConverter';
import TablePagination from '@/components/shared/table/TablePagination';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
import { Badge } from '@/components/ui/badge';
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
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface HeartbeatPreviewTableProps {
  licenseId?: string;
}
export default function HeartbeatPreviewTable({
  licenseId,
}: HeartbeatPreviewTableProps) {
  const t = useTranslations();
  const router = useRouter();

  const [heartbeats, setHeartbeats] = useState<
    ILicenseHeartbeatsGetSuccessResponse['heartbeats']
  >([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'lastBeatAt' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );
  const [totalHeartbeats, setTotalHeartbeats] = useState(1);

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
          `/api/heartbeats?${searchParams.toString()}`,
        );

        const data = (await response.json()) as ILicenseHeartbeatsGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setHeartbeats(data.heartbeats);
        setTotalHeartbeats(data.totalResults);
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
          {t('general.heartbeats')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {totalHeartbeats ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="truncate">
                    {t('general.device_identifier')}
                  </TableHead>
                  <TableHead className="truncate">
                    <Button
                      variant="ghost"
                      onClick={() => {
                        setSortColumn('lastBeatAt');
                        setSortDirection(
                          sortColumn === 'lastBeatAt' && sortDirection === 'asc'
                            ? 'desc'
                            : 'asc',
                        );
                      }}
                    >
                      {t('dashboard.licenses.last_beat_at')}
                      <ArrowDownUp className="ml-2 h-4 w-4" />
                    </Button>
                  </TableHead>
                  <TableHead className="truncate">
                    {t('general.ip_address')}
                  </TableHead>
                  <TableHead className="truncate">
                    {t('dashboard.licenses.status')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              {loading ? (
                <TableSkeleton columns={4} rows={3} />
              ) : (
                <TableBody>
                  {heartbeats.map((heartbeat) => (
                    <TableRow
                      key={heartbeat.id}
                      className="cursor-pointer"
                      onClick={() =>
                        router.push(`/dashboard/heartbeats/${heartbeat.id}`)
                      }
                    >
                      <TableCell>{heartbeat.deviceIdentifier}</TableCell>
                      <TableCell>
                        <DateConverter date={heartbeat.lastBeatAt} />
                      </TableCell>
                      <TableCell>{heartbeat.ipAddress}</TableCell>
                      <TableCell>
                        {heartbeat.status === 'inactive' ? (
                          <Badge variant="destructive">
                            {t('general.inactive')}
                          </Badge>
                        ) : (
                          <Badge variant="default">{t('general.active')}</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            <TablePagination
              page={page}
              pageSize={10}
              results={heartbeats.length}
              setPage={setPage}
              totalItems={totalHeartbeats}
              totalPages={Math.ceil(totalHeartbeats / 10)}
            />
          </>
        ) : (
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
            {t('dashboard.licenses.no_heartbeat_data')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
