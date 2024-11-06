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
import { TeamContext } from '@/providers/TeamProvider';
import { ArrowDownUp, CheckCircle, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import { CountryFlag } from '../../misc/CountryFlag';

interface HeartbeatPreviewTableProps {
  licenseId?: string;
}

const fetchHeartbeats = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as ILicenseHeartbeatsGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

export default function HeartbeatPreviewTable({
  licenseId,
}: HeartbeatPreviewTableProps) {
  const t = useTranslations();
  const teamCtx = useContext(TeamContext);

  const [page, setPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<'lastBeatAt' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );

  const searchParams = new URLSearchParams({
    page: page.toString(),
    pageSize: '10',
    ...(sortColumn && { sortColumn }),
    ...(sortDirection && { sortDirection }),
    ...(licenseId && { licenseId }),
  });

  const { data, error, isLoading } =
    useSWR<ILicenseHeartbeatsGetSuccessResponse>(
      teamCtx.selectedTeam
        ? ['/api/heartbeats', teamCtx.selectedTeam, searchParams.toString()]
        : null,
      ([url, _, params]) => fetchHeartbeats(`${url}?${params}`),
    );

  useEffect(() => {
    if (error) {
      toast.error(error.message ?? t('general.server_error'));
    }
  }, [error, t]);

  const heartbeats = data?.heartbeats ?? [];
  const totalHeartbeats = data?.totalResults ?? 1;

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
              {isLoading ? (
                <TableSkeleton columns={4} rows={3} />
              ) : (
                <TableBody>
                  {heartbeats.map((heartbeat) => (
                    <TableRow key={heartbeat.id}>
                      <TableCell>{heartbeat.deviceIdentifier}</TableCell>
                      <TableCell className="truncate">
                        <DateConverter date={heartbeat.lastBeatAt} />
                      </TableCell>
                      <TableCell className="flex items-center gap-2 truncate">
                        {heartbeat.alpha2 && (
                          <CountryFlag
                            countryCode={heartbeat.alpha2}
                            countryName={heartbeat.country}
                          />
                        )}
                        {heartbeat.ipAddress}
                      </TableCell>
                      <TableCell>
                        {heartbeat.status === 'inactive' ? (
                          <Badge variant="error">
                            <XCircle className="mr-1 h-3 w-3" />
                            {t('general.inactive')}
                          </Badge>
                        ) : (
                          <Badge variant="success">
                            <CheckCircle className="mr-1 h-3 w-3" />
                            {t('general.active')}
                          </Badge>
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
