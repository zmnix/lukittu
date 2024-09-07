'use client';
import {
  IDashboardRequestsGetResponse,
  IDashboardRequestsGetSuccessResponse,
} from '@/app/api/(dashboard)/dashboard/requests/route';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Area, AreaChart, CartesianGrid, XAxis } from 'recharts';
import { toast } from 'sonner';

const initialData = Array.from({ length: 24 }, (_, index) => {
  const date = new Date();
  date.setHours(date.getHours() - 23 + index, 0, 0, 0);

  return {
    date: date.toISOString(),
    total: 0,
    success: 0,
    failed: 0,
  };
});

export function RequestsAreaChart() {
  const t = useTranslations();
  const locale = useLocale();

  const [timeRange, setTimeRange] = useState('24h');
  const [data, setData] =
    useState<IDashboardRequestsGetSuccessResponse['data']>(initialData);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(
          `/api/dashboard/requests?timeRange=${timeRange}`,
        );
        const data = (await res.json()) as IDashboardRequestsGetResponse;

        if ('message' in data) {
          toast.error(data.message);
          return;
        }

        if (res.ok) {
          setData(data.data);
        }
      } catch (error: any) {
        toast.error(error.message ?? t('general.error_occurred'));
      }
    })();
  }, [t, timeRange]);

  const chartConfig = {
    total: {
      label: t('dashboard.dashboard.total'),
    },
    success: {
      label: t('dashboard.dashboard.success'),
      color: 'hsl(var(--chart-1))',
    },
    failed: {
      label: t('dashboard.dashboard.failed'),
      color: 'hsl(var(--chart-5))',
    },
  } satisfies ChartConfig;

  return (
    <Card>
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle>{t('dashboard.dashboard.requests')}</CardTitle>
          <CardDescription>
            {t('dashboard.dashboard.requests_description')}
          </CardDescription>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger
            aria-label="Select a value"
            className="w-[160px] rounded-lg sm:ml-auto"
          >
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
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <ChartContainer
          className="aspect-auto h-[250px] w-full"
          config={chartConfig}
        >
          <AreaChart data={data}>
            <defs>
              <linearGradient id="fillSuccess" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-success)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-success)"
                  stopOpacity={0.1}
                />
              </linearGradient>
              <linearGradient id="fillFailed" x1="0" x2="0" y1="0" y2="1">
                <stop
                  offset="5%"
                  stopColor="var(--color-failed)"
                  stopOpacity={0.8}
                />
                <stop
                  offset="95%"
                  stopColor="var(--color-failed)"
                  stopOpacity={0.1}
                />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} />
            <XAxis
              axisLine={false}
              dataKey="date"
              minTickGap={32}
              tickFormatter={(value) => {
                if (timeRange !== '24h') {
                  const date = new Date(value);
                  return date.toLocaleDateString(locale, {
                    month: 'short',
                    day: 'numeric',
                  });
                }

                const date = new Date(value);
                return date.toLocaleTimeString(locale, {
                  hour: 'numeric',
                  minute: 'numeric',
                });
              }}
              tickLine={false}
              tickMargin={8}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  indicator="dot"
                  labelFormatter={(value) => {
                    if (timeRange !== '24h') {
                      const date = new Date(value);
                      return date.toLocaleDateString(locale, {
                        month: 'short',
                        day: 'numeric',
                      });
                    }

                    const date = new Date(value);
                    return date.toLocaleTimeString(locale, {
                      hour: 'numeric',
                      minute: 'numeric',
                    });
                  }}
                />
              }
              cursor={false}
            />
            <Area
              dataKey="failed"
              fill="url(#fillFailed)"
              stackId="a"
              stroke="var(--color-failed)"
              type="natural"
            />
            <Area
              dataKey="success"
              fill="url(#fillSuccess)"
              stackId="a"
              stroke="var(--color-success)"
              type="natural"
            />
            <ChartLegend content={<ChartLegendContent />} />
          </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
