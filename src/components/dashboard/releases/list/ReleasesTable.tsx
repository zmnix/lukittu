'use client';
import AddEntityButton from '@/components/shared/misc/AddEntityButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ReleaseModalProvider } from '@/providers/ReleasesModalProvider';
import { Filter } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

export function ReleasesTable() {
  const t = useTranslations();

  const [, setMobileFiltersOpen] = useState(false);

  return (
    <ReleaseModalProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.releases')}
            <div className="ml-auto flex gap-2">
              <Button
                className="lg:hidden"
                size="sm"
                variant="outline"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <AddEntityButton entityType="release" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent />
      </Card>
    </ReleaseModalProvider>
  );
}
