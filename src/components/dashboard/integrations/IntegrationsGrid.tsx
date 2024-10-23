'use client';
import stripeSvg from '@/../public/integrations/stripe.svg';
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

const integrations = [
  {
    name: 'Stripe',
    description:
      'Stripe is a suite of payment APIs that powers commerce for businesses of all sizes.',
    logo: stripeSvg,
    isSetup: false,
    isActive: false,
  },
];

export default function IntegrationsGrid() {
  const t = useTranslations();

  return (
    <div className="grid grid-cols-3 gap-6 max-xl:grid-cols-2 max-md:grid-cols-1">
      {integrations.map((integration, index) => (
        <Card key={integration.name}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-2xl font-bold">
              {integration.name}
            </CardTitle>
            <Image alt={integration.name} height={30} src={integration.logo} />
          </CardHeader>
          <CardContent>
            <CardDescription>{integration.description}</CardDescription>
          </CardContent>
          <CardFooter className="flex items-center justify-between">
            <Badge variant={integration.isActive ? 'default' : 'secondary'}>
              {integration.isActive ? (
                <>
                  <CheckCircle className="mr-1 h-4 w-4" /> {t('general.active')}
                </>
              ) : (
                <>
                  <XCircle className="mr-1 h-4 w-4" /> {t('general.inactive')}
                </>
              )}
            </Badge>
            <Button
              size="sm"
              variant={integration.isSetup ? 'secondary' : 'default'}
            >
              {integration.isSetup ? 'Manage' : 'Setup'}
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
  );
}
