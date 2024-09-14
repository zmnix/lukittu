'use client';
import {
  ILogsGetResponse,
  ILogsGetSuccessResponse,
} from '@/app/api/(dashboard)/logs/route';
import TablePagination from '@/components/shared/table/TablePagination';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { ArrowDownUp } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { DateConverter } from '../../DateConverter';

interface RequestLogsPreviewTableProps {
  licenseId: string;
}

export default function RequestLogsPreviewTable({
  licenseId,
}: RequestLogsPreviewTableProps) {
  const [timeRange, setTimeRange] = useState('30d');
  const [logs, setLogs] = useState<ILogsGetSuccessResponse['logs']>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'createdAt' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );
  const [totalLogs, setTotalLogs] = useState(1);

  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

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

        if (timeRange) {
          searchParams.set('timeRange', timeRange);
        }

        searchParams.set('page', page.toString());
        searchParams.set('pageSize', '10');

        const response = await fetch(`/api/logs?${searchParams.toString()}`);

        const data = (await response.json()) as ILogsGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setLogs(data.logs);
        setTotalLogs(data.totalLogs);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, sortColumn, sortDirection, t, licenseId, timeRange]);

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 border-b py-5">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-xl font-bold">
            {t('dashboard.logs.logs')}
          </CardTitle>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[160px] rounded-lg sm:ml-auto">
            <SelectValue placeholder={t('dashboard.dashboard.last_24_hours')} />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem className="rounded-lg" value="24h">
              {t('dashboard.dashboard.last_24_hours')}
            </SelectItem>
            <SelectItem className="rounded-lg" value="7d">
              {t('dashboard.dashboard.last_7_days')}
            </SelectItem>
            <SelectItem className="rounded-lg" value="30d">
              {t('dashboard.dashboard.last_30_days')}
            </SelectItem>
            <SelectItem className="rounded-lg" value="6m">
              {t('dashboard.dashboard.last_6_months')}
            </SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        {totalLogs ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="truncate">
                    {t('general.ip_address')}
                  </TableHead>
                  <TableHead className="truncate">
                    {t('dashboard.licenses.status')}
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
                <TableSkeleton columns={4} rows={3} />
              ) : (
                <TableBody>
                  {logs.map((log) => (
                    <TableRow
                      key={log.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/dashboard/logs/${log.id}`)}
                    >
                      <TableCell className="flex items-center gap-2 truncate">
                        {log.alpha2 && (
                          <Image
                            alt={log.alpha3 ?? t('general.unknown')}
                            className="rounded-[2px]"
                            height={20}
                            src={`/countries/${log.alpha2.toLowerCase()}.svg`}
                            width={20}
                          />
                        )}
                        {log.ipAddress}
                      </TableCell>
                      <TableCell className="truncate">
                        <Badge className="text-xs" variant="secondary">
                          {log.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="truncate">
                        <DateConverter date={log.createdAt} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            <TablePagination
              page={page}
              pageSize={10}
              results={logs.length}
              setPage={setPage}
              totalItems={totalLogs}
              totalPages={Math.ceil(totalLogs / 10)}
            />
          </>
        ) : (
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
            {t('dashboard.logs.no_logs')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
