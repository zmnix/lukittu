'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useTranslations } from 'next-intl';

export default function ProductsList() {
  const t = useTranslations();
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {t('dashboard.navigation.products')}
        </CardTitle>
      </CardHeader>
      <CardContent />
    </Card>
  );
}
