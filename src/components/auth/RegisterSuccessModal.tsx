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

interface RegisterSuccessModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
}

export default function RegisterSuccessModal({
  open,
  onClose,
  email,
}: RegisterSuccessModalProps) {
  const t = useTranslations();
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('auth.register.email_sent_title')}</DialogTitle>
          <DialogDescription>
            {t.rich('auth.register.email_sent_description', {
              email,
              strong: (child) => <strong>{child}</strong>,
            })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <form action={onClose}>
            <LoadingButton type="submit" className="w-full">
              {t('general.close')}
            </LoadingButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
