import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import LoadingButton from '../shared/LoadingButton';

interface ForgotPasswordSuccessModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
}

export default function ForgotPasswordSuccessModal({
  open,
  onClose,
  email,
}: ForgotPasswordSuccessModalProps) {
  const t = useTranslations();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {t('auth.forgot_password.email_sent_title')}
          </DialogTitle>
          <DialogDescription>
            {t.rich('auth.forgot_password.email_sent_description', {
              email,
              strong: (child) => <strong>{child}</strong>,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <form action={onClose}>
            <LoadingButton className="w-full" type="submit" variant="outline">
              {t('general.close')}
            </LoadingButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
