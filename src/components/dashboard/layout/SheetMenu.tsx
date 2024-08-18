'use client';
import logoTextDark from '@/../public/logo_text_dark.svg';
import logoTextLight from '@/../public/logo_text_light.svg';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from '@/components/ui/sheet';
import { MenuIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Menu } from './Menu';
import { TeamSelector } from './TeamSelector';

export function SheetMenu() {
  const [logo, setLogo] = useState(logoTextDark);
  const theme = useTheme();

  useEffect(() => {
    setLogo(theme.theme === 'light' ? logoTextDark : logoTextLight);
  }, [theme.theme]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="h-8" size="icon" variant="ghost">
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
              <Image alt="Lukittu" height={38} src={logo} priority />
            </Link>
          </Button>
        </SheetHeader>
        <TeamSelector fullWidth />
        <Separator />
        <Menu topSpacing={false} isOpen />
      </SheetContent>
    </Sheet>
  );
}
