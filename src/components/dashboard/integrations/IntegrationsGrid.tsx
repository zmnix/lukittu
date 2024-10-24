'use client';
import stripeSvg from '@/../public/integrations/stripe.svg';
import {
  ITeamsIntegrationsGetResponse,
  ITeamsIntegrationsGetSuccessResponse,
} from '@/app/api/(dashboard)/teams/integrations/route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import SetStripeIntegrationModal from './modals/SetStripeIntegrationModal';

interface InitialIntegration {
  name: string;
  description: string;
  logo: any;
  key: keyof ITeamsIntegrationsGetSuccessResponse['integrations'];
}

const initialIntegrations: InitialIntegration[] = [
  {
    name: 'Stripe',
    description:
      'Stripe is a suite of payment APIs that powers commerce for businesses of all sizes.',
    logo: stripeSvg,
    key: 'stripeIntegration',
  },
];

export default function IntegrationsGrid() {
  const t = useTranslations();

  const [loading, setLoading] = useState(false);
  const [openSetupModal, setOpenSetupModal] = useState<
    keyof ITeamsIntegrationsGetSuccessResponse['integrations'] | null
  >(null);
  const [integrations, setIntegrations] = useState<
    ITeamsIntegrationsGetSuccessResponse['integrations'] | null
  >(null);

  const fetchData = useCallback(async () => {
    setLoading(true);

    try {
      const res = await fetch('/api/teams/integrations');
      const data = (await res.json()) as ITeamsIntegrationsGetResponse;

      if ('message' in data) {
        toast.error(data.message);
        return;
      }

      if (res.ok) {
        setIntegrations(data.integrations);
      }
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    fetchData();
  }, [t, fetchData]);

  const handleIntegrationModalClose = (open: boolean) => {
    fetchData();
    setOpenSetupModal(null);
  };

  return (
    <>
      <SetStripeIntegrationModal
        open={openSetupModal === 'stripeIntegration'}
        stripeIntegration={integrations?.stripeIntegration ?? null}
        onOpenChange={handleIntegrationModalClose}
      />
      <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
        {initialIntegrations.map((integration) => (
          <Card key={integration.name}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-2xl font-bold">
                {integration.name}
              </CardTitle>
              <Image
                alt={integration.name}
                height={30}
                src={integration.logo}
              />
            </CardHeader>
            <CardContent>
              <CardDescription>{integration.description}</CardDescription>
            </CardContent>
            <CardFooter className="flex items-center justify-between">
              <Badge
                variant={
                  integrations?.[integration.key]?.active
                    ? 'default'
                    : 'secondary'
                }
              >
                {integrations?.[integration.key]?.active ? (
                  <>
                    <CheckCircle className="mr-1 h-4 w-4" />{' '}
                    {t('general.active')}
                  </>
                ) : (
                  <>
                    <XCircle className="mr-1 h-4 w-4" /> {t('general.inactive')}
                  </>
                )}
              </Badge>
              <Button
                disabled={loading}
                size="sm"
                variant={
                  integrations?.[integration.key] ? 'secondary' : 'default'
                }
                onClick={() => setOpenSetupModal(integration.key)}
              >
                {integrations?.[integration.key] ? 'Manage' : 'Setup'}
              </Button>
            </CardFooter>
          </Card>
        ))}
        <Card className="flex items-center justify-center p-6">
          <p className="text-sm text-muted-foreground">
            {t.rich('dashboard.integrations.need_integrations', {
              strong: (children) => <strong>{children}</strong>,
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
        </Card>
      </div>
    </>
  );
}
