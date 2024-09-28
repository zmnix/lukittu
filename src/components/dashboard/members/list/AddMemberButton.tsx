'use client';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { MemberModalContext } from '@/providers/MemberModalProvider';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface AddMemberButtonProps {
  isTeamOwner: boolean;
}

export default function AddMemberButton({ isTeamOwner }: AddMemberButtonProps) {
  const t = useTranslations();
  const ctx = useContext(MemberModalContext);

  return (
    <TooltipProvider>
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          <span>
            <Button
              className="ml-auto flex gap-2"
              disabled={!isTeamOwner}
              size="sm"
              variant="default"
              onClick={() => ctx.setMemberModalOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span className="max-md:hidden">
                {t('dashboard.members.new_member')}
              </span>
            </Button>
          </span>
        </TooltipTrigger>
        {!isTeamOwner && (
          <TooltipContent>
            <span className="font-normal">
              {t('dashboard.members.only_for_owners')}
            </span>
          </TooltipContent>
        )}
      </Tooltip>
    </TooltipProvider>
  );
}
