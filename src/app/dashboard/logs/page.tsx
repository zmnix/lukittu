import LogViewer from '@/components/dashboard/logs/LogViewer';
import { Separator } from '@/components/ui/separator';
import { getTranslations } from 'next-intl/server';

export default async function LogsPage() {
  const t = await getTranslations();
  return (
    <div>
      <h1 className="text-2xl font-bold">{t('dashboard.navigation.logs')}</h1>
      <Separator className="mt-2" />
      <div className="mt-6 flex flex-col gap-6">
        <LogViewer />
      </div>
    </div>
  );
}
