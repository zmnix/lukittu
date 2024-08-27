'use client';
import { IAuthSignOutResponse } from '@/app/api/auth/sign-out/route';
import {
  ISessionsGetCurrentResponse,
  ISessionsGetCurrentSuccessResponse,
} from '@/app/api/sessions/current/route';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { createContext, useEffect, useState, useTransition } from 'react';
import { toast } from 'sonner';

export const AuthContext = createContext({
  session: null as ISessionsGetCurrentSuccessResponse['session'] | null,
  loading: true,
  setSession: ((
    session: ISessionsGetCurrentSuccessResponse['session'] | null,
  ) => {}) as React.Dispatch<
    React.SetStateAction<ISessionsGetCurrentSuccessResponse['session'] | null>
  >,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const t = useTranslations();
  const router = useRouter();

  const [pending, startTransition] = useTransition();
  const [session, setSession] = useState<
    ISessionsGetCurrentSuccessResponse['session'] | null
  >(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/sessions/current');
        if (!res.ok && res.status === 401) {
          setSession(null);
          try {
            const response = await fetch('/api/auth/sign-out', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });

            const data = (await response.json()) as IAuthSignOutResponse;

            if ('message' in data) {
              toast.error(data.message);
            }

            return;
          } catch (error: any) {
            toast.error(error.message ?? t('general.error_occurred'));
          } finally {
            router.push('/auth/login');
          }
        }

        const data = (await res.json()) as ISessionsGetCurrentResponse;

        setSession(data.session);
      } catch (error: any) {
        toast.error(error.message ?? t('general.error_occurred'));
      }
    };

    startTransition(async () => await fetchSession());
  }, [router, t]);

  if (pending || !session) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <LoadingSpinner size={38} />
      </div>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        loading: pending,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
