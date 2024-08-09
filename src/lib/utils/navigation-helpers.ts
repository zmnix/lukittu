import { discordIcon } from '@/components/shared/Icons';
import {
  BookOpenText,
  KeyRound,
  LayoutGrid,
  LucideIcon,
  Shield,
  ShoppingCart,
  Syringe,
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
          href: '/dashboard/injector',
          translation: 'injector',
          active: pathname === '/dashboard/injector',
          icon: Syringe,
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
          active: pathname === '/dashboard/bookings',
          icon: Shield,
          submenus: [
            {
              href: '/dashboard/bookings/list',
              translation: 'users',
              active: pathname === '/dashboard/bookings',
            },
            {
              href: '/dashboard/bookings/timeline',
              translation: 'audit_log',
              active: pathname === '/dashboard/bookings/timeline',
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
          active: pathname === '/dashboard/customers',
          icon: discordIcon as LucideIcon,
          submenus: [],
        },
      ],
    },
  ];
}
