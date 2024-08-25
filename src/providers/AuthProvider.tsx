'use client';
import {
  ISessionsGetCurrentResponse,
  ISessionsGetCurrentSuccessResponse,
} from '@/app/api/sessions/current/route';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { createContext, useEffect, useState } from 'react';

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
  const router = useRouter();

  const [loading, setLoading] = useState(true);
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
            await fetch('/api/auth/sign-out', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
            });
          } finally {
            router.push('/auth/login');
          }
        }

        const data = (await res.json()) as ISessionsGetCurrentResponse;

        setSession(data.session);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  if (loading || !session) {
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
        loading,
        setSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
