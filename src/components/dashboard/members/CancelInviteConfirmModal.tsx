import { ITeamsInviteCancelResponse } from '@/app/api/(dashboard)/teams/invite/[slug]/route';
import LoadingButton from '@/components/shared/LoadingButton';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { MemberModalContext } from '@/providers/MemberModalProvider';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import { toast } from 'sonner';

export function CancelInviteConfirmModal() {
  const t = useTranslations();
  const ctx = useContext(MemberModalContext);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const invitation = ctx.memberToCancelInvitation;

  if (!invitation) return null;

  const handleCancelInvitation = async (invitationId: string) => {
    const response = await fetch(`/api/teams/invite/${invitationId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json()) as ITeamsInviteCancelResponse;

    return data;
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      const res = await handleCancelInvitation(invitation.id);

      if ('message' in res) {
        toast.error(res.message);
      } else {
        toast.success(t('dashboard.members.invitation_cancelled'));
      }

      router.refresh();
      ctx.setMemberToCancelInvitation(null);
      handleOpenChange(false);
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    ctx.setMemberToCancelInvitationModalOpen(open);
  };

  return (
    <>
      <ResponsiveDialog
        open={ctx.memberToCancelInvitationModalOpen}
        onOpenChange={handleOpenChange}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t('dashboard.members.cancel_invitation_confirm_title')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t.rich(
                'dashboard.members.cancel_invitation_confirm_description',
                {
                  email: invitation.email,
                  strong: (child) => <strong>{child}</strong>,
                },
              )}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <LoadingButton
              size="sm"
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
                ctx.setMemberToCancelInvitation(null);
              }}
            >
              {t('general.cancel')}
            </LoadingButton>
            <LoadingButton
              pending={loading}
              size="sm"
              variant="destructive"
              onClick={onSubmit}
            >
              {t('dashboard.members.cancel_invitation')}
            </LoadingButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
