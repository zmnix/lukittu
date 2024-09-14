'use client';
import {
  IStatisticsRecentActivityGetResponse,
  IStatisticsRecentActivityGetSuccessResponse,
} from '@/app/api/(dashboard)/statistics/recent-activity/route';
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
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function RecentlyActiveCard() {
  const t = useTranslations();
  const locale = useLocale();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<
    IStatisticsRecentActivityGetSuccessResponse['data']
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/statistics/recent-activity');
        const data = (await res.json()) as IStatisticsRecentActivityGetResponse;

        if ('message' in data) {
          toast.error(data.message);
          return;
        }

        if (res.ok) {
          setData(data.data);
        }
      } catch (error: any) {
        toast.error(error.message ?? t('general.error_occurred'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [t]);

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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('dashboard.licenses.license')}</TableHead>
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
                    {new Date(row.createdAt).toLocaleString(locale, {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                    })}
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
      </CardContent>
    </Card>
  );
}
