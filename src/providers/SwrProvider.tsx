'use client';
import fetcher from '@/lib/utils/fetcher';
import { SWRConfig } from 'swr';

interface SWRProviderProps {
  children: React.ReactNode;
}

export const SWRProvider = ({ children }: SWRProviderProps) => (
  <SWRConfig
    value={{
      fetcher,
    }}
  >
    {children}
  </SWRConfig>
);
