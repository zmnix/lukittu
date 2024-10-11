'use client';
import {
  ITeamGetResponse,
  ITeamGetSuccessResponse,
} from '@/app/api/(dashboard)/teams/[slug]/route';
import { Card } from '@/components/ui/card';
import { TeamContext } from '@/providers/TeamProvider';
import { Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import GeneralSettings from './GeneralSettings';
import PublicKeysCard from './PublicKeysCard';
import { TeamDetails } from './TeamDetails';

export default function TeamSettingsCard() {
  const t = useTranslations();
  const teamCtx = useContext(TeamContext);

  const [team, setTeam] = useState<ITeamGetSuccessResponse['team'] | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      try {
        if (!teamCtx.selectedTeam) return;

        const response = await fetch(`/api/teams/${teamCtx.selectedTeam}`);

        const data = (await response.json()) as ITeamGetResponse;

        setTeam(data.team);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      }
    })();
  }, [t, teamCtx.selectedTeam]);

  return (
    <>
      <div className="flex">
        <div className="flex w-full gap-4 max-xl:flex-col-reverse">
          {teamCtx.selectedTeam ? (
            <>
              <div className="flex w-full max-w-full flex-col gap-4 overflow-auto">
                <GeneralSettings team={team} />
                <PublicKeysCard team={team} />
              </div>
              <aside className="flex w-full max-w-96 flex-shrink-0 flex-col gap-4 max-xl:max-w-full">
                <TeamDetails team={team} />
              </aside>
            </>
          ) : (
            <Card className="flex w-full flex-col md:flex-row">
              <div className="w-full">
                <div className="flex w-full flex-col items-center justify-center p-6 pt-0">
                  <div className="flex w-full flex-col items-center justify-center gap-4 py-20">
                    <div className="flex">
                      <span className="rounded-lg bg-secondary p-4">
                        <Shield className="h-6 w-6" />
                      </span>
                    </div>
                    <h3 className="text-lg font-bold">
                      {t('dashboard.settings.no_team')}
                    </h3>
                    <p className="max-w-sm text-center text-sm text-muted-foreground">
                      {t('dashboard.settings.no_team_description')}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
