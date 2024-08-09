import GeneralSettings from '@/components/dashboard/profile/GeneralSettings';
import LoginSessions from '@/components/dashboard/profile/LoginSessions';
import { Separator } from '@/components/ui/separator';
import { getSession } from '@/lib/utils/auth';
import { getTranslations } from 'next-intl/server';
import { cookies } from 'next/headers';

export default async function ProfilePage() {
  const currentSessionCookie = cookies().get('session')!;

  const t = await getTranslations();
  const session = await getSession({
    user: {
      include: {
        sessions: true,
      },
    },
  });

  const sessionsWithCurrent = session.user.sessions.map((session) => ({
    ...session,
    current: session.sessionId === currentSessionCookie?.value,
  }));

  return (
    <>
      <div>
        <h1 className="text-2xl font-bold">{t('general.profile')}</h1>
        <Separator className="mt-2" />
      </div>
      <div className="mt-6 flex flex-col gap-6">
        <GeneralSettings user={session.user} />
        <LoginSessions sessions={sessionsWithCurrent} />
      </div>
    </>
  );
}
