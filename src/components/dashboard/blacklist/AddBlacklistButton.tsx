'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/tailwind-helpers';
import { BlacklistModalContext } from '@/providers/BlacklistModalProvider';
import { TeamContext } from '@/providers/TeamProvider';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface AddBlacklistButtonProps {
  displayText?: boolean;
}

export default function AddBlacklistButton({
  displayText = false,
}: AddBlacklistButtonProps) {
  const t = useTranslations();
  const ctx = useContext(BlacklistModalContext);
  const teamCtx = useContext(TeamContext);

  return (
    <Button
      className="ml-auto flex gap-2"
      disabled={!teamCtx.selectedTeam}
      size="sm"
      variant="default"
      onClick={() => ctx.setBlacklistModalOpen(true)}
    >
      <Plus className="h-4 w-4" />
      <span
        className={cn('max-md:hidden', {
          'max-md:block': displayText,
        })}
      >
        {t('dashboard.blacklist.add_blacklist')}
      </span>
    </Button>
  );
}
