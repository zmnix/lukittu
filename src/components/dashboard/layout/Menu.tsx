'use client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getMenuList } from '@/lib/utils/navigation-helpers';
import { cn } from '@/lib/utils/tailwind-helpers';
import { CalendarPlus, Ellipsis } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CollapseMenuButton } from './CollapseMenuButton';

interface MenuProps {
  isOpen: boolean | undefined;
  topSpacing?: boolean;
}

export function Menu({ isOpen, topSpacing = true }: MenuProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const menuList = getMenuList(pathname);

  return (
    <ScrollArea className="h-full [&>div>div[style]]:!block [&>div>div[style]]:h-full">
      <nav className={cn('h-full w-full', topSpacing && 'pt-8')}>
        <ul className="flex h-full flex-col items-start space-y-1 px-2">
          {menuList.map(({ groupTranslation, menus }, index) => (
            <li
              key={index}
              className={cn('w-full', groupTranslation ? 'pt-5' : '')}
            >
              {(isOpen && groupTranslation) || isOpen === undefined ? (
                <p className="max-w-[248px] truncate px-4 pb-2 text-sm font-medium text-muted-foreground">
                  {t(
                    `dashboard.navigation.${groupTranslation as Exclude<typeof groupTranslation, ''>}`,
                  )}
                </p>
              ) : !isOpen && isOpen !== undefined && groupTranslation ? (
                <TooltipProvider>
                  <Tooltip delayDuration={100}>
                    <TooltipTrigger className="w-full">
                      <div className="flex w-full items-center justify-center">
                        <Ellipsis className="h-5 w-5" />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="right">
                      <p>
                        {t(
                          `dashboard.navigation.${groupTranslation as Exclude<typeof groupTranslation, ''>}`,
                        )}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
              {menus.map(
                ({ href, translation, icon: Icon, active, submenus }, index) =>
                  submenus.length === 0 ? (
                    <div key={index} className="w-full">
                      <TooltipProvider disableHoverableContent>
                        <Tooltip delayDuration={100}>
                          <TooltipTrigger asChild>
                            <Button
                              className="mb-1 h-10 w-full justify-start"
                              variant={active ? 'secondary' : 'ghost'}
                              asChild
                            >
                              <Link href={href}>
                                <span
                                  className={cn(isOpen === false ? '' : 'mr-4')}
                                >
                                  <Icon size={18} />
                                </span>
                                <p
                                  className={cn(
                                    'max-w-[200px] truncate',
                                    isOpen === false
                                      ? '-translate-x-96 opacity-0'
                                      : 'translate-x-0 opacity-100',
                                  )}
                                >
                                  {t(`dashboard.navigation.${translation}`)}
                                </p>
                              </Link>
                            </Button>
                          </TooltipTrigger>
                          {isOpen === false && (
                            <TooltipContent side="right">
                              {t(`dashboard.navigation.${translation}`)}
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  ) : (
                    <div key={index} className="w-full">
                      <CollapseMenuButton
                        active={active}
                        icon={Icon}
                        isOpen={isOpen}
                        submenus={submenus}
                        translation={translation}
                      />
                    </div>
                  ),
              )}
            </li>
          ))}
          <li className="flex w-full grow items-end">
            <TooltipProvider disableHoverableContent>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    className="mt-5 h-10 w-full justify-center"
                    onClick={() => {}}
                  >
                    <span className={cn(isOpen === false ? '' : 'mr-4')}>
                      <CalendarPlus size={18} />
                    </span>
                    <p
                      className={cn(
                        'whitespace-nowrap',
                        isOpen === false ? 'hidden opacity-0' : 'opacity-100',
                      )}
                    >
                      {t('general.new_license')}
                    </p>
                  </Button>
                </TooltipTrigger>
                {isOpen === false && (
                  <TooltipContent side="right">
                    {t('general.new_license')}
                  </TooltipContent>
                )}
              </Tooltip>
            </TooltipProvider>
          </li>
        </ul>
      </nav>
    </ScrollArea>
  );
}
