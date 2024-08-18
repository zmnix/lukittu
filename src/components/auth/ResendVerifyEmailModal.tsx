import resendVerifyEmail from '@/actions/auth/resend-verify-email';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
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
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (boolean: boolean) => void;
  email: string;
}

export default function ResendVerifyEmailModal({
  open,
  onOpenChange,
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
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[525px]">
        {response ? (
          <>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>
                {response.isError
                  ? t('auth.emails.sending_failed_title')
                  : t('auth.resend_verify.title')}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {response.isError
                  ? response.message
                  : t.rich('auth.resend_verify.description', {
                      email,
                      strong: (children) => <strong>{children}</strong>,
                    })}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <ResponsiveDialogFooter>
              <div>
                <LoadingButton
                  className="w-full"
                  type="submit"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  {t('general.close')}
                </LoadingButton>
              </div>
            </ResponsiveDialogFooter>
          </>
        ) : (
          <>
            <ResponsiveDialogHeader>
              <ResponsiveDialogTitle>
                {t('auth.verify_email.title')}
              </ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {t('auth.verify_email.description')}
              </ResponsiveDialogDescription>
            </ResponsiveDialogHeader>
            <ResponsiveDialogFooter>
              <form onSubmit={onSubmit}>
                <LoadingButton
                  className="w-full"
                  pending={pending}
                  type="submit"
                >
                  {t('auth.verify_email.resend_email')}
                </LoadingButton>
              </form>
            </ResponsiveDialogFooter>
          </>
        )}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
