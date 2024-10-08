// TODO: REMOVE TEMPORARY WAITLIST
'use client';
import { IWaitlistResponse } from '@/app/api/(dashboard)/waitlist/route';
import { Input } from '@/components/ui/input';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import LoadingButton from '../shared/LoadingButton';

interface WaitlistModalProps {
  open: boolean;
  onOpenChange: (boolean: boolean) => void;
}

export default function WaitlistModal({
  open,
  onOpenChange,
}: WaitlistModalProps) {
  const t = useTranslations();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/waitlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as IWaitlistResponse;

      if ('message' in data) {
        return toast.error(data.message);
      }

      toast.success(t('auth.waitlist.joined_waitlist'));
      setEmail('');
      onOpenChange(false);
      router.replace('/auth/login');
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[625px]">
        <div className="relative z-10">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle className="mb-2 text-center text-2xl font-bold">
              {t('auth.waitlist.coming_soon')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription className="pb-4 text-center text-muted-foreground">
              {t('auth.waitlist.description')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-2 max-md:px-2">
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="relative">
                <Input
                  className="w-full border-primary"
                  id="email"
                  placeholder={t('auth.waitlist.enter_your_email')}
                  type="email"
                  value={email}
                  required
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <LoadingButton
                className="w-full"
                disabled={loading}
                pending={loading}
                type="submit"
                variant="default"
              >
                {t('auth.waitlist.join_waitlist')}
              </LoadingButton>
            </form>
          </div>
          <ResponsiveDialogFooter>
            <p className="mt-2 w-full text-center text-xs text-gray-500">
              {t.rich('auth.waitlist.join_questions', {
                discordLinkElement: (children) => (
                  <Link
                    className="font-semibold text-primary"
                    href="https://discord.com/invite/5Gxh4V3dSC"
                  >
                    {children}
                  </Link>
                ),
                emailElement: (children) => (
                  <Link
                    className="font-semibold text-primary"
                    href="mailto:support@lukittu.com"
                  >
                    {children}
                  </Link>
                ),
              })}
            </p>
          </ResponsiveDialogFooter>
        </div>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
