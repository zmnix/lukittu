'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/tailwind-helpers';
import { CustomerModalContext } from '@/providers/CustomerModalProvider';
import { TeamContext } from '@/providers/TeamProvider';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface AddCustomerButtonProps {
  displayText?: boolean;
}

export default function AddCustomerButton({
  displayText = false,
}: AddCustomerButtonProps) {
  const t = useTranslations();
  const ctx = useContext(CustomerModalContext);
  const teamCtx = useContext(TeamContext);

  return (
    <Button
      className="ml-auto flex gap-2"
      disabled={!teamCtx.selectedTeam}
      size="sm"
      variant="default"
      onClick={() => ctx.setCustomerModalOpen(true)}
    >
      <Plus className="h-4 w-4" />
      <span
        className={cn('max-md:hidden', {
          'max-md:block': displayText,
        })}
      >
        {t('dashboard.customers.add_customer')}
      </span>
    </Button>
  );
}
