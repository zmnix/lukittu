'use client';
import {
  IStatisticsRecentActivityGetResponse,
  IStatisticsRecentActivityGetSuccessResponse,
} from '@/app/api/(dashboard)/statistics/recent-activity/route';
import { DateConverter } from '@/components/shared/DateConverter';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TeamContext } from '@/providers/TeamProvider';
import { Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';

const fetchRecentActivity = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as IStatisticsRecentActivityGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

export default function RecentlyActiveCard() {
  const t = useTranslations();
  const teamCtx = useContext(TeamContext);

  const {
    data: response,
    error,
    isLoading,
  } = useSWR<IStatisticsRecentActivityGetSuccessResponse>(
    teamCtx.selectedTeam
      ? ['/api/statistics/recent-activity', teamCtx.selectedTeam]
      : null,
    ([url]) => fetchRecentActivity(url),
  );

  useEffect(() => {
    if (error) {
      toast.error(error.message ?? t('general.error_occurred'));
    }
  }, [error, t]);

  const hasData = response?.data.length ? response.data.length > 0 : false;

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 border-b py-5">
        <div className="grid flex-1 gap-1">
          <CardTitle className="text-xl">
            {t('dashboard.dashboard.recently_activity')}
          </CardTitle>
          <CardDescription className="text-sm text-muted-foreground">
            {t('dashboard.dashboard.recently_activity_description')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {hasData ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('general.license')}</TableHead>
                <TableHead>{t('general.created_at')}</TableHead>
                <TableHead>{t('dashboard.licenses.status')}</TableHead>
              </TableRow>
            </TableHeader>
            {isLoading ? (
              <TableSkeleton columns={3} rows={4} />
            ) : (
              <TableBody>
                {response?.data.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.license}</TableCell>
                    <TableCell>
                      <DateConverter date={row.createdAt} />
                    </TableCell>
                    <TableCell>
                      <Badge className="text-xs" variant="secondary">
                        {row.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            )}
          </Table>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4">
              <div className="flex">
                <span className="rounded-lg bg-secondary p-4">
                  <Clock className="h-6 w-6" />
                </span>
              </div>
              <h3 className="text-lg font-bold">
                {t('dashboard.dashboard.no_recent_activity')}
              </h3>
              <p className="max-w-sm text-center text-sm text-muted-foreground">
                {t('dashboard.dashboard.no_recent_activity_description')}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
