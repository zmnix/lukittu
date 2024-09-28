'use client';
import {
  ITeamGetResponse,
  ITeamGetSuccessResponse,
} from '@/app/api/(dashboard)/teams/[slug]/route';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import GeneralSettings from './GeneralSettings';
import PublicKeysCard from './PublicKeysCard';
import { TeamDetails } from './TeamDetails';

export default function TeamSettingsCard() {
  const t = useTranslations();

  const [team, setTeam] = useState<ITeamGetSuccessResponse['team'] | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      try {
        const cookies = document.cookie.split(';');
        const selectedTeam = cookies.find((cookie) =>
          cookie.includes('selectedTeam'),
        );

        const selectedTeamId = selectedTeam?.split('=')?.[1];

        if (!selectedTeamId) {
          throw new Error(t('validation.unauthorized'));
        }

        const response = await fetch(`/api/teams/${selectedTeamId}`);

        const data = (await response.json()) as ITeamGetResponse;

        setTeam(data.team);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      }
    })();
  }, [t]);

  return (
    <>
      <div className="flex">
        <div className="flex w-full gap-4 max-xl:flex-col-reverse">
          <div className="flex w-full max-w-full flex-col gap-4 overflow-auto">
            <GeneralSettings />
            <PublicKeysCard publicKeyRsa={team?.publicKeyRsa} />
          </div>
          <aside className="flex w-full max-w-96 flex-shrink-0 flex-col gap-4 max-xl:max-w-full">
            <TeamDetails team={team} />
          </aside>
        </div>
      </div>
    </>
  );
}
