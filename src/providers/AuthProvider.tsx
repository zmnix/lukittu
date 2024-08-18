/* eslint-disable no-unused-vars */
'use client';
import { SessionWithUserAndTeams } from '@/app/api/session/current/route';
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
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<SessionWithUserAndTeams | null>(null);

  useEffect(() => {
    const fetchSession = async () => {
      try {
        const res = await fetch('/api/session/current');
        if (res.redirected) {
          window.location.href = res.url;
          return;
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
  }, []);

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
