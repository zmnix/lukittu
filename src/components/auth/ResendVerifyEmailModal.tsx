import resendVerifyEmail from '@/actions/auth/resend-verify-email';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import LoadingButton from '../shared/LoadingButton';

const initialState = {
  message: '',
  isError: false,
} as {
  message?: string;
  isError: boolean;
};

interface ResendVerifyEmailModalProps {
  open: boolean;
  onClose: () => void;
  email: string;
}

export default function ResendVerifyEmailModal({
  open,
  onClose,
  email,
}: ResendVerifyEmailModalProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [response, setResponse] = useState<typeof initialState | null>(null);

  const onSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    startTransition(async () => {
      const response = await resendVerifyEmail({ email });
      setResponse(response);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        {response ? (
          <>
            <DialogHeader>
              <DialogTitle>
                {response.isError
                  ? t('auth.emails.sending_failed_title')
                  : t('auth.resend_verify.title')}
              </DialogTitle>
              <DialogDescription>
                {response.isError
                  ? response.message
                  : t.rich('auth.resend_verify.description', {
                      email,
                      strong: (children) => <strong>{children}</strong>,
                    })}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <form action={onClose}>
                <LoadingButton
                  className="w-full"
                  type="submit"
                  variant="secondary"
                >
                  {t('general.close')}
                </LoadingButton>
              </form>
            </DialogFooter>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{t('auth.verify_email.title')}</DialogTitle>
              <DialogDescription>
                {t('auth.verify_email.description')}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <form onSubmit={onSubmit}>
                <LoadingButton
                  className="w-full"
                  pending={pending}
                  type="submit"
                >
                  {t('auth.verify_email.resend_email')}
                </LoadingButton>
              </form>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
