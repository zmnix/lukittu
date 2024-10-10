'use client';
import {
  IStatisticsCardDataGetResponse,
  IStatisticsCardDataGetSuccessResponse,
} from '@/app/api/(dashboard)/statistics/card-data/route';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Activity, Key, Package, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
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

  const comparedToPrevious = data?.trends.activeLicensesPreviousPeriod
    ? data.activeLicenses > data.trends.activeLicensesPreviousPeriod
      ? `+${((data.activeLicenses - data.trends.activeLicensesPreviousPeriod) / data.trends.activeLicensesPreviousPeriod) * 100}%`
      : `-${((data.trends.activeLicensesPreviousPeriod - data.activeLicenses) / data.trends.activeLicensesPreviousPeriod) * 100}%`
    : '+0%';

  return (
    <div className="grid h-full grid-cols-4 gap-4 max-xl:grid-cols-2 max-sm:grid-cols-1">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            {t('dashboard.dashboard.active_licenses')}
          </CardTitle>
          <span className="rounded-full bg-primary p-2">
            <Activity className="text-white" size={22} />
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
                {data?.activeLicenses ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {comparedToPrevious}{' '}
                {t('dashboard.dashboard.compared_to_last_period').toLowerCase()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
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
                {data?.totalLicenses ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.dashboard.new_in_last_7_days', {
                  count: data?.trends.licensesLastWeek ?? 0,
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
                {data?.totalProducts ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.dashboard.new_in_last_7_days', {
                  count: data?.trends.productsLastWeek ?? 0,
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
                {data?.totalCustomers ?? 0}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('dashboard.dashboard.new_in_last_7_days', {
                  count: data?.trends.customersLastWeek ?? 0,
                }).toLowerCase()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
