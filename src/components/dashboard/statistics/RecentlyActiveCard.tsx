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
import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function RecentlyActiveCard() {
  const t = useTranslations();
  const teamCtx = useContext(TeamContext);

  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<
    IStatisticsRecentActivityGetSuccessResponse['data']
  >([]);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    const fetchData = async (initial?: boolean) => {
      if (!teamCtx.selectedTeam) return;

      if (initial) {
        setLoading(true);
      }

      try {
        const res = await fetch('/api/statistics/recent-activity');
        const data = (await res.json()) as IStatisticsRecentActivityGetResponse;

        if ('message' in data) {
          toast.error(data.message);
          return;
        }

        if (res.ok) {
          setData(data.data);
          if (data.data.length === 0) {
            setHasData(false);
          }
        }
      } catch (error: any) {
        toast.error(error.message ?? t('general.error_occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData(true);

    // Fetch data every 60 seconds
    const intervalId = setInterval(fetchData, 60000);

    return () => clearInterval(intervalId);
  }, [t, teamCtx.selectedTeam]);

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
            {loading ? (
              <TableSkeleton columns={3} rows={4} />
            ) : (
              <TableBody>
                {data.map((row) => (
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
