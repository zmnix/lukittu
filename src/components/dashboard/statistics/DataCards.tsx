'use client';
import {
  IStatisticsCardDataGetResponse,
  IStatisticsCardDataGetSuccessResponse,
} from '@/app/api/(dashboard)/statistics/card-data/route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Key, Logs, Package, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

export default function DataCards() {
  const t = useTranslations();

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<
    IStatisticsCardDataGetSuccessResponse['data'] | null
  >(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/statistics/card-data');
        const data = (await res.json()) as IStatisticsCardDataGetResponse;

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

  const successPercentage = useMemo(() => {
    if (!data) return 0;
    return (
      (data.requestsLast24h.success /
        (data.requestsLast24h.success + data.requestsLast24h.failed)) *
      100
    );
  }, [data]);

  const failedPercentage = useMemo(() => {
    if (!data) return 0;
    return (
      (data.requestsLast24h.failed /
        (data.requestsLast24h.success + data.requestsLast24h.failed)) *
      100
    );
  }, [data]);

  return (
    <div className="grid h-full grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.dashboard.total_licenses')}
          </CardTitle>
          <span className="rounded-full bg-primary p-2">
            <Key className="text-white" size={22} />
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-2 h-4 w-32" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {data?.totalLicenses.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.dashboard.new_in_last_7_days', {
                  count: data?.trends.licensesLastWeek,
                }).toLowerCase()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.dashboard.total_products')}
          </CardTitle>
          <span className="rounded-full bg-primary p-2">
            <Package className="text-white" size={22} />
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-2 h-4 w-32" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {data?.totalProducts.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.dashboard.new_in_last_7_days', {
                  count: data?.trends.productsLastWeek,
                }).toLowerCase()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.dashboard.total_customers')}
          </CardTitle>
          <span className="rounded-full bg-primary p-2">
            <Users className="text-white" size={22} />
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-2 h-4 w-32" />
            </>
          ) : (
            <>
              <div className="text-2xl font-bold">
                {data?.totalCustomers.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.dashboard.new_in_last_7_days', {
                  count: data?.trends.customersLastWeek,
                }).toLowerCase()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.dashboard.requests_24h')}
          </CardTitle>
          <span className="rounded-full bg-primary p-2">
            <Logs className="text-white" size={22} />
          </span>
        </CardHeader>
        <CardContent>
          {loading ? (
            <>
              <Skeleton className="h-6 w-24" />
              <Skeleton className="mt-2 h-4 w-32" />
            </>
          ) : (
            <>
              <div className="mb-2 mt-1 text-2xl font-bold">
                <div className="relative flex items-center justify-between">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="h-4 w-full rounded-lg bg-primary" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-foreground">
                            {t('dashboard.dashboard.success')}:
                          </span>{' '}
                          {data?.requestsLast24h.success} (
                          {successPercentage.toFixed(1)}%)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div
                          className="absolute right-0 top-0 h-4 rounded-lg bg-[#d33131]"
                          style={{
                            width: `${failedPercentage}%`,
                          }}
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="text-xs text-muted-foreground">
                          <span className="text-foreground">
                            {t('dashboard.dashboard.failed')}:
                          </span>{' '}
                          {data?.requestsLast24h.failed} (
                          {failedPercentage.toFixed(1)}%)
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.dashboard.requests_in_last_24_hours', {
                  count:
                    (data?.requestsLast24h.failed ?? 0) +
                    (data?.requestsLast24h.success ?? 0),
                }).toLowerCase()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
