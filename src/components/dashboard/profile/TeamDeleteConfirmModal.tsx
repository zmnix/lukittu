/* eslint-disable no-unused-vars */
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Team } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

interface DeleteTeamConfirmModalProps {
  team: Team | null;
  onClose: () => void;
  onConfirm: (team: Team, teamNameConfirmation: string) => Promise<void>;
}

export function DeleteTeamConfirmModal({
  team,
  onClose,
  onConfirm,
}: DeleteTeamConfirmModalProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [confirmName, setConfirmName] = useState('');

  if (!team) return null;

  const handleConfirm = async () => {
    startTransition(async () => {
      await onConfirm(team, confirmName);
      onClose();
    });
  };

  return (
    <AlertDialog open={Boolean(team)} onOpenChange={onClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('dashboard.profile.delete_team_confirm_title')}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t.rich('dashboard.profile.delete_team_confirm_description', {
              teamName: team.name,
              strong: (child) => <strong>{child}</strong>,
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="grid w-full gap-1.5">
          <Label htmlFor="confirmName">
            {t.rich('dashboard.profile.delete_team_confirm_input', {
              teamName: `"${team.name.toUpperCase()}"`,
              code: (child) => (
                <code className="text-xs font-semibold">{child}</code>
              ),
            })}
          </Label>
          <Input
            id="confirmName"
            onChange={(e) => setConfirmName(e.target.value)}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel
            className={buttonVariants({ variant: 'outline', size: 'sm' })}
            onClick={onClose}
          >
            {t('general.cancel')}
          </AlertDialogCancel>
          <LoadingButton
            className={buttonVariants({
              variant: 'destructive',
              size: 'sm',
            })}
            disabled={confirmName !== team.name.toUpperCase()}
            pending={pending}
            onClick={handleConfirm}
          >
            {t('general.delete_team')}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
