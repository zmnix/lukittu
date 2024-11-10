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
import { bytesToMb } from '@/lib/utils/number-helpers';
import { Clock, Mail } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface TeamLimitsProps {
  team: ITeamGetSuccessResponse['team'] | null;
}

export default function TeamLimits({ team }: TeamLimitsProps) {
  const t = useTranslations();

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
        <div className="flex items-center justify-between border-t pt-2">
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
        <Button size="sm">
          <Mail className="mr-2 h-4 w-4" />
          {t('dashboard.settings.contact_support')}
        </Button>
      </CardFooter>
    </Card>
  );
}
