/* eslint-disable no-unused-vars */
'use client';
import { SessionWithUserAndTeams } from '@/app/api/session/current/route';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
import { useRouter } from 'next/navigation';
import { createContext, useEffect, useState } from 'react';

export const AuthContext = createContext({
  session: null as SessionWithUserAndTeams | null,
  loading: true,
  setSession: ((
    session: SessionWithUserAndTeams | null,
  ) => {}) as React.Dispatch<
    React.SetStateAction<SessionWithUserAndTeams | null>
  >,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionWithUserAndTeams | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/session/current');
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

        const data = await res.json();
        setSession(data.session);
      } catch (error) {
        console.error('Error fetching session:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSession();
  }, [router]);

  if (loading) {
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
