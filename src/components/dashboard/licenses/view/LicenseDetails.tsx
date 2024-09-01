import { ILicenseGetSuccessResponse } from '@/app/api/(dashboard)/licenses/[slug]/route';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useTranslations } from 'next-intl';

interface LicenseDetailsProps {
  license: ILicenseGetSuccessResponse['license'];
}

export function LicenseDetails({ license }: LicenseDetailsProps) {
  const t = useTranslations();
  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">
          {t('auth.register.title')}
        </CardTitle>
        <CardDescription>{t('auth.register.description')}</CardDescription>
      </CardHeader>
    </Card>
  );
}
