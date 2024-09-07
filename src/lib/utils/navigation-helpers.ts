import { discordIcon } from '@/components/shared/Icons';
import {
  BookOpenText,
  KeyRound,
  LayoutGrid,
  Logs,
  LucideIcon,
  Shield,
  ShoppingCart,
  Users,
} from 'lucide-react';
import { Messages } from '../../../global';

type Submenu = {
  href: string;
  translation: keyof Messages['dashboard']['navigation'];
  active: boolean;
};

type Menu = {
  href: string;
  translation: keyof Messages['dashboard']['navigation'];
  active: boolean;
  icon: LucideIcon;
  submenus: Submenu[];
};

type Group = {
  groupTranslation: keyof Messages['dashboard']['navigation'] | '';
  menus: Menu[];
};

export function getMenuList(pathname: string): Group[] {
  return [
    {
      groupTranslation: '',
      menus: [
        {
          href: '/dashboard',
          translation: 'dashboard',
          active: pathname === '/dashboard',
          icon: LayoutGrid,
          submenus: [],
        },
      ],
    },
    {
      groupTranslation: '',
      menus: [
        {
          href: '/dashboard/licenses',
          translation: 'licenses',
          active: pathname === '/dashboard/licenses',
          icon: KeyRound,
          submenus: [],
        },
      ],
    },
    {
      groupTranslation: '',
      menus: [
        {
          href: '/dashboard/products',
          translation: 'products',
          active: pathname === '/dashboard/products',
          icon: ShoppingCart,
          submenus: [],
        },
      ],
    },
    {
      groupTranslation: '',
      menus: [
        {
          href: '/dashboard/customers',
          translation: 'customers',
          active: pathname === '/dashboard/customers',
          icon: Users,
          submenus: [],
        },
      ],
    },
    {
      groupTranslation: '',
      menus: [
        {
          href: '/dashboard/logs',
          translation: 'logs',
          active: pathname === '/dashboard/logs',
          icon: Logs,
          submenus: [],
        },
      ],
    },
    {
      groupTranslation: '',
      menus: [
        {
          href: '',
          translation: 'team',
          active: pathname === '/dashboard/team',
          icon: Shield,
          submenus: [
            {
              href: '/dashboard/team/users',
              translation: 'users',
              active: pathname === '/dashboard/team/users',
            },
            {
              href: '/dashboard/team/audit-log',
              translation: 'audit_log',
              active: pathname === '/dashboard/team/audit-log',
            },
          ],
        },
      ],
    },
    {
      groupTranslation: 'external_links',
      menus: [
        {
          href: '#',
          translation: 'documentation',
          active: pathname === '#',
          icon: BookOpenText,
          submenus: [],
        },
        {
          href: '#',
          translation: 'discord',
          active: pathname === '#',
          icon: discordIcon as LucideIcon,
          submenus: [],
        },
      ],
    },
  ];
}
