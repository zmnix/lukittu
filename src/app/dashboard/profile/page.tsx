import GeneralSettingsCard from '@/components/dashboard/profile/GeneralSettingsCard';
import LoginSessionsCard from '@/components/dashboard/profile/LoginSessionsCard';
import TeamListCard from '@/components/dashboard/profile/TeamListCard';
import { Separator } from '@/components/ui/separator';
import { getLanguage } from '@/lib/utils/header-helpers';
import { Metadata } from 'next';
import { useTranslations } from 'next-intl';
import { getTranslations } from 'next-intl/server';

export default function ProfilePage() {
  const t = useTranslations();
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">{t('general.profile')}</h1>
        <Separator className="mt-2" />
      </div>
      <div className="mt-6 flex flex-col gap-6">
        <GeneralSettingsCard />
        <LoginSessionsCard />
        <TeamListCard />
      </div>
    </>
  );
}

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations({ locale: getLanguage() });

  return {
    title: `${t('general.profile')} | Lukittu`,
  };
}
