'use client';
import signOut from '@/actions/auth/sign-out';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { User } from '@prisma/client';
import { LogOut, UserIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';

interface UserDropdownProps {
  user: User;
}

export function UserDropdown({ user }: UserDropdownProps) {
  const t = useTranslations();

  const getInitials = (fullName: string) => {
    // Get maximum of 2 initials. If the name has only 1 word, get the first 2 letters.
    // If the name has 2 words, get the first letter of each word.
    // If the name has more than 2 words, get the first letter of the first 2 words.
    const initials = fullName
      .split(' ')
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join('');

    return initials;
  };

  return (
    <DropdownMenu>
      <TooltipProvider disableHoverableContent>
        <Tooltip delayDuration={100}>
          <TooltipTrigger asChild>
            <DropdownMenuTrigger asChild>
              <Button
                className="relative h-8 w-8 rounded-full"
                variant="default"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage alt="Avatar" src="#" />
                  <AvatarFallback className="bg-transparent">
                    {getInitials(user.fullName)}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent side="bottom">{t('general.profile')}</TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <DropdownMenuContent align="end" className="w-56" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.fullName}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem className="hover:cursor-pointer" asChild>
            <Link className="flex items-center" href="/dashboard/profile">
              <UserIcon className="mr-3 h-4 w-4 text-muted-foreground" />
              {t('general.profile')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={async () => {
            await signOut();
          }}
        >
          <LogOut className="mr-3 h-4 w-4 text-muted-foreground" />
          {t('general.sign_out')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
