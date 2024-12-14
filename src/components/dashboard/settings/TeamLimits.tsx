import { ITeamGetSuccessResponse } from '@/app/api/(dashboard)/teams/[slug]/route';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { bytesToMb } from '@/lib/utils/number-helpers';
import { AuthContext } from '@/providers/AuthProvider';
import { TeamContext } from '@/providers/TeamProvider';
import { Clock, CreditCard } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useContext } from 'react';

interface TeamLimitsProps {
  team: ITeamGetSuccessResponse['team'] | null;
}

export default function TeamLimits({ team }: TeamLimitsProps) {
  const t = useTranslations();
  const teamCtx = useContext(TeamContext);
  const authCtx = useContext(AuthContext);

  const selectedTeam = teamCtx.teams.find(
    (team) => team.id === teamCtx.selectedTeam,
  );

  const isTeamOwner = selectedTeam?.ownerId === authCtx.session?.user.id;

  const limits = [
    {
      name: t('dashboard.navigation.licenses'),
      current: team?.counts.licenseCount ?? 0,
      max: team?.limits.maxLicenses ?? 1,
    },
    {
      name: t('dashboard.navigation.products'),
      current: team?.counts.productCount ?? 0,
      max: team?.limits.maxProducts ?? 1,
    },
    {
      name: t('dashboard.navigation.customers'),
      current: team?.counts.customerCount ?? 0,
      max: team?.limits.maxCustomers ?? 1,
    },
    {
      name: t('dashboard.navigation.members'),
      current: team?.counts.memberCount ?? 0,
      max: team?.limits.maxTeamMembers ?? 1,
    },
    {
      name: t('dashboard.settings.total_storage_used'),
      current: bytesToMb(team?.totalStorageUsed ?? 0),
      max: team?.limits.maxStorage ?? 1,
      unit: 'MB',
    },
  ];

  const handleSubscriptionManagement = async () => {
    window.location.href = '/api/billing/subscription-management';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          {t('dashboard.settings.limits')}
        </CardTitle>
        <CardDescription>
          {t('dashboard.settings.limits_description')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {limits.map((limit) => (
          <div key={limit.name} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>{limit.name}</span>
              <span>
                {limit.current} / {limit.max} {limit.unit ?? ''}
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full bg-primary"
                style={{ width: `${(limit.current / limit.max) * 100}%` }}
              />
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="flex items-center">
            <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {t('dashboard.settings.log_retention')}
            </span>
          </div>
          <span className="text-sm">
            {team?.limits.logRetention ?? 0} {t('general.days')}
          </span>
        </div>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-4">
        <p className="text-sm text-muted-foreground">
          {t.rich('dashboard.settings.need_increased_limits', {
            emailElement: (children) => (
              <Link
                className="font-semibold text-primary"
                href="mailto:support@lukittu.com"
              >
                {children}
              </Link>
            ),
          })}
        </p>
        <TooltipProvider>
          <Tooltip delayDuration={50}>
            <TooltipTrigger asChild>
              <div className="w-full">
                <Button
                  className="flex items-center gap-2"
                  disabled={!isTeamOwner}
                  size="sm"
                  onClick={handleSubscriptionManagement}
                >
                  <CreditCard className="h-5 w-5" />
                  {t('dashboard.subscriptions.manage_subscription')}
                </Button>
              </div>
            </TooltipTrigger>
            {!isTeamOwner && (
              <TooltipContent>
                {t('dashboard.members.only_for_owners')}
              </TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </CardFooter>
    </Card>
  );
}
