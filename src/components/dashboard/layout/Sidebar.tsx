'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/tailwind-helpers';
import { SidebarContext } from '@/providers/SidebarProvider';
import { LoaderPinwheel } from 'lucide-react';
import Link from 'next/link';
import { useContext } from 'react';
import { Menu } from './Menu';

export function Sidebar() {
  const ctx = useContext(SidebarContext);

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-20 h-screen -translate-x-full bg-background transition-[width] duration-300 ease-in-out lg:translate-x-0',
        ctx?.open === false ? 'w-[90px]' : 'w-72',
      )}
    >
      <div className="relative flex h-full flex-col overflow-y-auto border-r px-3 py-4">
        <Button
          className={cn(
            'mb-1 transition-transform duration-300 ease-in-out',
            ctx.open === false ? 'translate-x-1' : 'translate-x-0',
          )}
          variant="link"
          asChild
        >
          <Link className="flex items-center gap-2" href="/dashboard">
            <LoaderPinwheel className="mr-1 h-6 w-6" />
            <h1
              className={cn(
                'whitespace-nowrap text-lg font-bold uppercase transition-[transform,opacity,display] duration-300 ease-in-out',
                ctx.open === false
                  ? 'hidden -translate-x-96 opacity-0'
                  : 'translate-x-0 opacity-100',
              )}
            >
              Lukittu
            </h1>
          </Link>
        </Button>
        <Menu isOpen={ctx.open} />
      </div>
    </aside>
  );
}
