import { ILicenseGetSuccessResponse } from '@/app/api/(dashboard)/licenses/[slug]/route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  getLicenseStatus,
  getLicenseStatusBadgeVariant,
} from '@/lib/utils/license-helpers';
import { Copy, Infinity, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';

interface LicenseDetailsProps {
  license: ILicenseGetSuccessResponse['license'] | null;
}

export function LicenseDetails({ license }: LicenseDetailsProps) {
  const [showMore, setShowMore] = useState(false);
  const t = useTranslations();
  const locale = useLocale();

  return (
    <Card>
      <CardHeader className="flex flex-row flex-wrap items-center gap-2 border-b py-5">
        <CardTitle className="flex items-center text-xl font-bold">
          {t('dashboard.licenses.details')}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-2 pt-4 sm:px-6 sm:pt-6">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">ID</h3>
            <div className="text-sm font-semibold">
              {license ? (
                license.createdBy ? (
                  <span className="flex items-center gap-2">
                    <Copy className="h-4 w-4 shrink-0" />
                    <TooltipProvider>
                      <Tooltip delayDuration={0}>
                        <TooltipTrigger asChild>
                          <span
                            className="truncate text-primary hover:underline"
                            role="button"
                            onClick={() => {
                              navigator.clipboard.writeText(license.id);
                              toast.success(t('general.copied_to_clipboard'));
                            }}
                          >
                            {license.id}
                          </span>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{t('general.click_to_copy')}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </span>
                ) : (
                  t('general.unknown')
                )
              ) : (
                <Skeleton className="h-4 w-full" />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">
              {t('dashboard.licenses.status')}
            </h3>
            <div className="text-sm text-muted-foreground">
              {license ? (
                <Badge
                  className="text-xs"
                  variant={getLicenseStatusBadgeVariant(
                    getLicenseStatus(license),
                  )}
                >
                  {t(
                    `general.${getLicenseStatus(license).toLowerCase()}` as any,
                  )}
                </Badge>
              ) : (
                <Skeleton className="h-4 w-full" />
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">
              {t('dashboard.licenses.expiration_type')}
            </h3>
            <div className="text-sm text-muted-foreground">
              {license ? (
                t(
                  `dashboard.licenses.${license.expirationType.toLowerCase()}` as any,
                )
              ) : (
                <Skeleton className="h-4 w-full" />
              )}
            </div>
          </div>
          {license ? (
            license.expirationType === 'DATE' && (
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">
                  {t('dashboard.licenses.expiration_date')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(license.expirationDate!).toLocaleString(locale, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            )
          ) : (
            <Skeleton className="h-4 w-full" />
          )}
          {license ? (
            license.expirationType === 'DURATION' && (
              <>
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">
                    {t('dashboard.licenses.expiration_start')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      `dashboard.licenses.${license.expirationStart.toLowerCase()}` as any,
                    )}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">
                    {t('dashboard.licenses.expiration_days')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {license.expirationDays}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-sm font-semibold">
                    {t('dashboard.licenses.expiration_start')}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {t(
                      `dashboard.licenses.${
                        license.expirationDate
                          ? license.expirationDate?.toLocaleString(locale, {
                              day: '2-digit',
                              month: '2-digit',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'not_yet_activated'
                      }` as any,
                    )}
                  </p>
                </div>
              </>
            )
          ) : (
            <Skeleton className="h-4 w-full" />
          )}
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold">
              {t('dashboard.licenses.ip_limit')}
            </h3>
            <div className="text-sm text-muted-foreground">
              {license ? (
                (license.ipLimit ?? <Infinity className="h-4 w-4 shrink-0" />)
              ) : (
                <Skeleton className="h-4 w-full" />
              )}
            </div>
          </div>
          {showMore && (
            <>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">
                  {t('general.created_at')}
                </h3>
                <div className="text-sm text-muted-foreground">
                  {license ? (
                    new Date(license.createdAt).toLocaleString(locale, {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  ) : (
                    <Skeleton className="h-4 w-full" />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">
                  {t('general.updated_at')}
                </h3>
                <div className="text-sm text-muted-foreground">
                  {license ? (
                    new Date(license.updatedAt).toLocaleString(locale, {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  ) : (
                    <Skeleton className="h-4 w-full" />
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="text-sm font-semibold">
                  {t('general.created_by')}
                </h3>
                <div className="text-sm font-semibold">
                  {license ? (
                    license.createdBy ? (
                      <span className="flex items-center gap-2">
                        <User className="h-4 w-4 shrink-0" />
                        <Link
                          className="text-primary hover:underline"
                          href={`/dashboard/users/${license.createdBy.id}`}
                        >
                          {license.createdBy.fullName}
                        </Link>
                      </span>
                    ) : (
                      t('general.unknown')
                    )
                  ) : (
                    <Skeleton className="h-4 w-full" />
                  )}
                </div>
              </div>
            </>
          )}
        </div>
        <Button
          className="mt-2 px-0"
          size="sm"
          variant="link"
          onClick={() => setShowMore(!showMore)}
        >
          {showMore ? t('general.show_less') : t('general.show_more')}
        </Button>
      </CardContent>
    </Card>
  );
}
