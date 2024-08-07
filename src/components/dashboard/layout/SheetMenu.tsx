import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Team } from '@prisma/client';
import { MenuIcon, PanelsTopLeft } from 'lucide-react';
import Link from 'next/link';
import { Menu } from './Menu';
import { TeamSelector } from './TeamSelector';

interface SheetMenuProps {
  teams: Team[];
}

export function SheetMenu({ teams }: SheetMenuProps) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="h-8" variant="ghost">
          <MenuIcon />
        </Button>
      </SheetTrigger>
      <SheetContent className="flex h-full flex-col px-3 sm:w-72" side="left">
        <SheetHeader>
          <Button
            className="flex items-center justify-center pb-2 pt-1"
            variant="link"
            asChild
          >
            <Link className="flex items-center gap-2" href="/dashboard">
              <PanelsTopLeft className="mr-1 h-6 w-6" />
              <h1 className="text-lg font-bold">Lukittu</h1>
            </Link>
          </Button>
        </SheetHeader>
        <TeamSelector teams={teams} fullWidth />
        <Separator />
        <Menu topSpacing={false} isOpen />
      </SheetContent>
    </Sheet>
  );
}
