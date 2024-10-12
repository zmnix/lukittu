/* eslint-disable @typescript-eslint/no-unnecessary-condition */
'use client';
import ConfettiButton from '@/components/shared/ConfettiButton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { getMenuList } from '@/lib/utils/navigation-helpers';
import { cn } from '@/lib/utils/tailwind-helpers';
import {
  ChevronDownIcon,
  ChevronUpIcon,
  CreditCard,
  Ellipsis,
  Rocket,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { CollapseMenuButton } from './CollapseMenuButton';

interface MenuProps {
  isOpen: boolean | undefined;
  topSpacing?: boolean;
  onClose?: () => void;
}

export function Menu({ isOpen, topSpacing = true, onClose }: MenuProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const menuList = getMenuList(pathname);
  const isCustom = false;

  const [isExpanded, setIsExpanded] = useState(false);

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
              ) : !isOpen && groupTranslation ? (
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
                              onClick={onClose}
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
                        onClick={onClose}
                      />
                    </div>
                  ),
              )}
            </li>
          ))}
          <li className="flex w-full grow items-end pt-6">
            <div
              className={cn('w-full', {
                hidden: isOpen === false,
              })}
            >
              <Card className="w-full max-w-sm overflow-hidden transition-all duration-300 ease-in-out">
                <CardHeader
                  className="cursor-pointer p-4"
                  onClick={() => setIsExpanded(!isExpanded)}
                >
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-bold">
                      {isCustom
                        ? t('dashboard.subscriptions.custom_plan')
                        : t('dashboard.subscriptions.free_plan')}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <Badge
                        className="uppercase"
                        variant={isCustom ? 'default' : 'secondary'}
                      >
                        {isCustom ? t('general.active') : t('general.basic')}
                      </Badge>
                      {isExpanded ? (
                        <ChevronUpIcon className="h-5 w-5" />
                      ) : (
                        <ChevronDownIcon className="h-5 w-5" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <div
                  className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96' : 'max-h-0'}`}
                >
                  <CardContent className="px-4 pb-0 pt-0">
                    <CardDescription className="mb-4">
                      {isCustom
                        ? t('dashboard.subscriptions.using_custom_description')
                        : t('dashboard.subscriptions.using_free_description')}
                    </CardDescription>
                  </CardContent>
                  <CardFooter className="px-4">
                    {!isCustom ? (
                      <ConfettiButton className="flex w-full items-center gap-2">
                        <Rocket className="h-5 w-5" />
                        {t('dashboard.subscriptions.upgrade_to_premium')}
                      </ConfettiButton>
                    ) : (
                      <Button
                        className="flex w-full items-center gap-2"
                        size="sm"
                      >
                        <CreditCard className="h-5 w-5" />
                        {t('dashboard.subscriptions.manage_subscription')}
                      </Button>
                    )}
                  </CardFooter>
                </div>
              </Card>
            </div>
            <TooltipProvider disableHoverableContent>
              <Tooltip delayDuration={100}>
                <TooltipTrigger asChild>
                  <div
                    className={cn('w-full', {
                      hidden: isOpen,
                    })}
                  >
                    <Button
                      className="flex w-full items-center justify-center"
                      size="sm"
                    >
                      {isCustom ? (
                        <CreditCard className="h-5 w-5" />
                      ) : (
                        <Rocket className="h-5 w-5" />
                      )}
                    </Button>
                  </div>
                </TooltipTrigger>
                {isOpen === false && (
                  <TooltipContent side="right">
                    {isCustom
                      ? t('dashboard.subscriptions.manage_subscription')
                      : t('dashboard.subscriptions.upgrade_to_premium')}
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
