import DataCards from '@/components/dashboard/dashboard/DataCards';
import { ProductDivisionPieChart } from '@/components/dashboard/dashboard/ProductDivisionPieChart';
import { RequestsAreaChart } from '@/components/dashboard/dashboard/RequestsAreaChart';
import WorldMapChart from '@/components/dashboard/dashboard/WorldMapChart';
import { Separator } from '@/components/ui/separator';
import { useTranslations } from 'next-intl';

export default function Dashboard() {
  const t = useTranslations();
  return (
    <div>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.dashboard')}
      </h1>
      <Separator className="mt-2" />
      <div className="mt-6 grid grid-cols-12 gap-4">
        <div className="col-span-12">
          <DataCards />
        </div>
        <div className="col-span-12 xl:col-span-8">
          <RequestsAreaChart />
        </div>
        <div className="col-span-12 xl:col-span-4">
          <ProductDivisionPieChart />
        </div>
        <div className="col-span-12 xl:col-span-8">
          <WorldMapChart />
        </div>
      </div>
    </div>
  );
}
