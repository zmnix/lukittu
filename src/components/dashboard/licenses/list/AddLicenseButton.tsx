'use client';
import { Button } from '@/components/ui/button';
import { LicenseModalContext } from '@/providers/LicenseModalProvider';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

export default function AddLicenseButton() {
  const t = useTranslations();
  const ctx = useContext(LicenseModalContext);

  return (
    <Button
      className="ml-auto"
      size="sm"
      variant="default"
      onClick={() => ctx.setLicenseModalOpen(true)}
    >
      <Plus className="mr-2 h-4 w-4" />
      {t('dashboard.licenses.add_license')}
    </Button>
  );
}
