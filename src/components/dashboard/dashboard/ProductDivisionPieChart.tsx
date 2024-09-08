'use client';
import { IDashboardProductDivisionGetResponse } from '@/app/api/(dashboard)/dashboard/product-division/route';
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
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { Label, Pie, PieChart } from 'recharts';
import { toast } from 'sonner';

interface RenderLabelProps {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
  index: number;
}

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: RenderLabelProps) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text
      dominantBaseline="central"
      fill="white"
      textAnchor={x > cx ? 'start' : 'end'}
      x={x}
      y={y}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export function ProductDivisionPieChart() {
  const t = useTranslations();

  const [data, setData] = useState<
    {
      id: string;
      name: string;
      licenses: number;
      fill: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch('/api/dashboard/product-division');
        const data = (await res.json()) as IDashboardProductDivisionGetResponse;

        if ('message' in data) {
          toast.error(data.message);
          return;
        }

        if (res.ok) {
          setData(
            data.data.map(({ name, licenses, id }) => ({
              id,
              name,
              licenses,
              fill: `var(--color-${id})`,
            })),
          );
        }
      } catch (error: any) {
        toast.error(error.message ?? t('general.error_occurred'));
      }
    };

    fetchData();
  }, [t]);

  const chartConfig = data.reduce<ChartConfig>((acc, { name, id }, index) => {
    acc[id] = {
      label: name,
      color: `hsl(var(--chart-${index + 1}))`,
    };
    return acc;
  }, {});

  const total = data.reduce((acc, { licenses }) => acc + licenses, 0);

  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="flex items-center gap-2 space-y-0 border-b py-5 sm:flex-row">
        <div className="grid flex-1 gap-1 text-center sm:text-left">
          <CardTitle className="text-xl">
            {t('dashboard.dashboard.product_division')}
          </CardTitle>
          <CardDescription>
            {t('dashboard.dashboard.product_division_description')}
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          className="mx-auto aspect-square max-h-[300px]"
          config={chartConfig}
        >
          <PieChart>
            <ChartTooltip
              content={<ChartTooltipContent hideLabel />}
              cursor={false}
            />
            <Pie
              data={data}
              dataKey="licenses"
              innerRadius={70}
              label={renderCustomizedLabel}
              labelLine={false}
              nameKey="name"
              strokeWidth={5}
            >
              <Label
                content={({ viewBox }) => {
                  if (viewBox && 'cx' in viewBox && 'cy' in viewBox) {
                    return (
                      <text
                        dominantBaseline="middle"
                        textAnchor="middle"
                        x={viewBox.cx}
                        y={viewBox.cy}
                      >
                        <tspan
                          className="fill-foreground text-3xl font-bold"
                          x={viewBox.cx}
                          y={viewBox.cy}
                        >
                          {total}
                        </tspan>
                        <tspan
                          className="fill-muted-foreground"
                          x={viewBox.cx}
                          y={(viewBox.cy || 0) + 24}
                        >
                          {t('dashboard.navigation.licenses')}
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
            <ChartLegend
              className="-translate-y-2 flex-wrap gap-2 [&>*]:basis-1/4 [&>*]:justify-center"
              content={<ChartLegendContent nameKey="id" />}
            />
          </PieChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
