import LoadingButton from '@/components/shared/LoadingButton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { Team } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useEffect, useState, useTransition } from 'react';

interface LeaveTeamConfirmModalProps {
  team: Team | null;
  onClose: () => void;
  // eslint-disable-next-line no-unused-vars
  onConfirm: (team: Team) => Promise<void>;
}

export function LeaveTeamConfirmModal({
  team,
  onClose,
  onConfirm,
}: LeaveTeamConfirmModalProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [confirmTimer, setConfirmTimer] = useState(15);

  useEffect(() => {
    if (confirmTimer === 0) {
      return;
    }

    const timer = setTimeout(() => {
      setConfirmTimer(confirmTimer - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [confirmTimer]);

  if (!team) return null;

  const handleConfirm = async () => {
    startTransition(async () => {
      await onConfirm(team);
      onClose();
    });
  };

  return (
    <AlertDialog open={Boolean(team)} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('dashboard.profile.team_leave_confirm_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich('dashboard.profile.team_leave_confirm_description', {
              teamName: team.name,
              strong: (child) => <strong>{child}</strong>,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            onClick={onClose}
          >
            {t('general.cancel')}
          </AlertDialogCancel>
          <LoadingButton
            className={buttonVariants({ variant: 'destructive', size: 'sm' })}
            disabled={confirmTimer > 0}
            pending={pending}
            onClick={handleConfirm}
          >
            {confirmTimer === 0
              ? t('general.leave_team')
              : `${t('general.leave_team')} (${confirmTimer})`}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
