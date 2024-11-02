'use client';
import { ITeamGetResponse } from '@/app/api/(dashboard)/teams/[slug]/route';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TeamContext } from '@/providers/TeamProvider';
import { useTranslations } from 'next-intl';
import { useContext, useEffect } from 'react';
import { toast } from 'sonner';
import useSWR from 'swr';
import PublicKeysCard from './PublicKeysCard';
import { TeamDetails } from './TeamDetails';
import TeamGeneralSettings from './TeamGeneralSettings';
import TeamLimits from './TeamLimits';

const fetchTeams = async (url: string) => {
  const response = await fetch(url);
  const data = (await response.json()) as ITeamGetResponse;

  if ('message' in data) {
    throw new Error(data.message);
  }

  return data;
};

export default function TeamSettingsCard() {
  const t = useTranslations();
  const teamCtx = useContext(TeamContext);

  const { data, error } = useSWR<ITeamGetResponse>(
    teamCtx.selectedTeam ? ['/api/teams', teamCtx.selectedTeam] : null,
    ([url, selectedTeam]) => fetchTeams(`${url}/${selectedTeam}`),
  );

  useEffect(() => {
    if (error) {
      toast.error(error.message ?? t('general.server_error'));
    }
  }, [error, t]);

  const team = data?.team;

  if (!team || !teamCtx.selectedTeam) {
    return null;
  }

  return (
    <div className="flex">
      <div className="flex w-full gap-4 max-xl:flex-col-reverse">
        <>
          <div className="flex w-full max-w-full flex-col gap-4 overflow-auto">
            <Tabs className="w-full" defaultValue="generalSettings">
              <TabsList className="mb-4 grid h-auto w-full grid-cols-3">
                <TabsTrigger value="generalSettings">
                  {t('dashboard.settings.general_settings')}
                </TabsTrigger>
                <TabsTrigger value="publicKeys">
                  {t('dashboard.settings.public_keys')}
                </TabsTrigger>{' '}
                <TabsTrigger value="limits">
                  {t('dashboard.settings.limits')}
                </TabsTrigger>
              </TabsList>
              <TabsContent value="generalSettings">
                <TeamGeneralSettings team={team} />
              </TabsContent>
              <TabsContent value="publicKeys">
                <PublicKeysCard team={team} />
              </TabsContent>
              <TabsContent value="limits">
                <TeamLimits team={team} />
              </TabsContent>
            </Tabs>
          </div>
          <aside className="flex w-full max-w-96 flex-shrink-0 flex-col gap-4 max-xl:max-w-full">
            <TeamDetails team={team} />
          </aside>
        </>
      </div>
    </div>
  );
}
