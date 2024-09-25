'use client';
import { ITeamsMembersGetSuccessResponse } from '@/app/api/(dashboard)/teams/members/route';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MemberModalContext } from '@/providers/MemberModalProvider';
import { Edit, Ellipsis } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface MembersDropdownProps {
  member: ITeamsMembersGetSuccessResponse['members'][number];
}

export const MembersActionDropdown = ({ member }: MembersDropdownProps) => {
  const ctx = useContext(MemberModalContext);
  const t = useTranslations();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-medium" forceMount>
        <DropdownMenuItem
          className="text-destructive hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            ctx.setMemberToKick(member);
            ctx.setMemberToKickModalOpen(true);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          {t('dashboard.members.kick_member')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
