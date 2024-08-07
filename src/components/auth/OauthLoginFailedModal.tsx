import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import SubmitButton from '../shared/SubmitButton';

interface OauthLoginFailedModalProps {
  error: string;
  provider: string | null;
}

export default function OauthLoginFailedccessModal({
  error,
  provider,
}: OauthLoginFailedModalProps) {
  const t = useTranslations();
  const [open, setOpen] = useState(true);

  const router = useRouter();

  const handleClose = () => {
    setOpen(false);
    router.push('/auth/login');
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('auth.login.login_failed')}</DialogTitle>
          <DialogDescription>
            {error === 'wrong_provider' ? (
              <>
                {t('general.wrong_provider', {
                  provider: t(`auth.oauth.${provider}` as any),
                })}
              </>
            ) : (
              <>
                {t(`auth.oauth.${error}` as any, {
                  provider: t(`auth.oauth.${provider}` as any),
                })}
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <form action={handleClose}>
            <SubmitButton label={t('general.close')} />
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
