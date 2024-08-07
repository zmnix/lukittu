import GeneralSettings from '@/components/dashboard/profile/GeneralSettings';
import { Separator } from '@/components/ui/separator';
import { getSession } from '@/lib/utils/auth';
import { getTranslations } from 'next-intl/server';

export default async function ProfilePage() {
  const t = await getTranslations();
  const session = await getSession({ user: true });
  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">{t('general.profile')}</h1>
        <Separator className="mt-2" />
      </div>
      <div className="mt-6 flex flex-col gap-6">
        <GeneralSettings user={session.user} />
      </div>
    </>
  );
}
