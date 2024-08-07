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
    </div>
  );
}
