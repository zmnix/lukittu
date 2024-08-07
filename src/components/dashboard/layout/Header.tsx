import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { Team, User } from '@prisma/client';
import { ThemeSwitcher } from '../../shared/ThemeSwitcher';
import { SheetMenu } from './SheetMenu';
import { SidebarToggleButton } from './SidebarToggleButton';
import { TeamSelector } from './TeamSelector';
import { UserDropdown } from './UserDropdown';

interface HeaderProps {
  session: {
    user: User & { teams: Team[] };
  };
}

export default function Header({ session }: HeaderProps) {
  return (
    <div className="sticky top-0 z-20 bg-background">
      <nav className="flex h-16 items-center justify-between pl-4 pr-6">
        <div className="flex items-center gap-2">
          <div className="lg:hidden">
            <SheetMenu teams={session.user.teams} />
          </div>
          <div className="max-lg:hidden">
            <SidebarToggleButton />
          </div>
          <div className="max-lg:hidden">
            <TeamSelector teams={session.user.teams} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeSwitcher variant="ghost" />
          <LanguageSwitcher variant="ghost" />
          <UserDropdown user={session.user} />
        </div>
      </nav>
    </div>
  );
}
