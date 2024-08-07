'use client';
import { cn } from '@/lib/utils/tailwind-helpers';
import { SidebarContext } from '@/providers/SidebarProvider';
import { useContext } from 'react';

interface MainAreaProps {
  children: React.ReactNode;
}

export default function MainArea({ children }: MainAreaProps) {
  const ctx = useContext(SidebarContext);
  return (
    <main
      className={cn(
        'transition-[margin-left] duration-300 ease-in-out',
        ctx.open === false ? 'lg:ml-[90px]' : 'lg:ml-72',
      )}
    >
      {children}
    </main>
  );
}
