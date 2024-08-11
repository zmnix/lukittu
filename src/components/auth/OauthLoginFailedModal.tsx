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
import LoadingButton from '../shared/LoadingButton';

interface OauthLoginFailedModalProps {
  error: string | null;
  provider: string | null;
}

export default function OauthLoginFailedccessModal({
  error,
  provider,
}: OauthLoginFailedModalProps) {
  const t = useTranslations();

  const router = useRouter();

  const handleClose = () => {
    router.push('/auth/login');
  };

  if (!error) return null;

  return (
    <Dialog open={Boolean(error)} onOpenChange={handleClose}>
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
            <LoadingButton className="w-full" type="submit" variant="outline">
              {t('general.close')}
            </LoadingButton>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
