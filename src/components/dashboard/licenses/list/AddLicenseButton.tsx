'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/tailwind-helpers';
import { LicenseModalContext } from '@/providers/LicenseModalProvider';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface AddLicenseButtonProps {
  displayText?: boolean;
}

export default function AddLicenseButton({
  displayText = false,
}: AddLicenseButtonProps) {
  const t = useTranslations();
  const ctx = useContext(LicenseModalContext);

  return (
    <Button
      className="ml-auto flex gap-2"
      size="sm"
      variant="default"
      onClick={() => ctx.setLicenseModalOpen(true)}
    >
      <Plus className="h-4 w-4" />
      <span
        className={cn('max-md:hidden', {
          'max-md:block': displayText,
        })}
      >
        {t('dashboard.licenses.add_license')}
      </span>
    </Button>
  );
}
