import { ILicenseGetSuccessResponse } from '@/app/api/(dashboard)/licenses/[slug]/route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  getLicenseStatus,
  getLicenseStatusBadgeVariant,
} from '@/lib/utils/license-helpers';
import { IdCard, Infinity, User } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Link from 'next/link';
import { useState } from 'react';

interface LicenseDetailsProps {
  license: ILicenseGetSuccessResponse['license'];
}

export function LicenseDetails({ license }: LicenseDetailsProps) {
  const [showMore, setShowMore] = useState(false);
  const t = useTranslations();
  const locale = useLocale();
  return (
    <Card className="w-96">
      <CardHeader className="flex flex-row items-center justify-between space-y-1 py-2">
        <CardTitle className="text-xl font-bold">
          {t('dashboard.licenses.details')}
        </CardTitle>
        <Button className="mt-0" size="sm" variant="outline">
          {t('general.edit')}
        </Button>
      </CardHeader>
      <Separator />
      <CardContent className="mt-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">{t('dashboard.licenses.status')}</h3>
            <p className="text-sm text-muted-foreground">
              <Badge
                className="text-xs"
                variant={getLicenseStatusBadgeVariant(
                  getLicenseStatus(license),
                )}
              >
                {t(`general.${getLicenseStatus(license).toLowerCase()}` as any)}
              </Badge>
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">
              {t('dashboard.licenses.expiration_type')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {t(
                `dashboard.licenses.${license.expirationType.toLowerCase()}` as any,
              )}
            </p>
          </div>
          {license.expirationType === 'DATE' && (
            <div className="flex flex-col gap-2">
              <h3 className="font-semibold">
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
          )}
          {license.expirationType === 'DURATION' && (
            <>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">
                  {t('dashboard.licenses.expiration_start')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(
                    `dashboard.licenses.${license.expirationStart.toLowerCase()}` as any,
                  )}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">
                  {t('dashboard.licenses.expiration_days')}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {license.expirationDays}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">
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
          )}
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">
              {t('dashboard.licenses.ip_limit')}
            </h3>
            <p className="text-sm text-muted-foreground">
              {license.ipLimit ?? <Infinity className="h-4 w-4 shrink-0" />}
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">
              {t('dashboard.navigation.customers')}
            </h3>
            {license.customers.length ? (
              <div className="flex flex-col gap-3">
                {license.customers.map((customer) => (
                  <div key={customer.id}>
                    <div className="flex items-center gap-2">
                      <IdCard className="h-4 w-4 shrink-0" />
                      <Link
                        className="truncate text-sm font-semibold text-primary hover:underline"
                        href={`/dashboard/customers/${customer.id}`}
                        title={customer.id}
                      >
                        {customer.id}
                      </Link>
                    </div>
                    <p
                      className="text-sm font-semibold text-muted-foreground"
                      title={customer.email ?? t('general.no_email')}
                    >
                      {customer.email ?? t('general.no_email')}
                    </p>
                    <p
                      className="text-sm text-muted-foreground"
                      title={customer.fullName ?? t('general.no_name')}
                    >
                      {customer.fullName ?? t('general.no_name')}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.licenses.no_customers_assigned')}
              </p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <h3 className="font-semibold">
              {t('dashboard.navigation.products')}
            </h3>
            {license.products.length ? (
              <div className="flex flex-col gap-3">
                {license.products.map((product) => (
                  <div key={product.id}>
                    <div className="flex items-center gap-2">
                      <IdCard className="h-4 w-4 shrink-0" />
                      <Link
                        className="truncate text-sm font-semibold text-primary hover:underline"
                        href={`/dashboard/products/${product.id}`}
                        title={product.id}
                      >
                        {product.id}
                      </Link>
                    </div>
                    <p
                      className="text-sm text-muted-foreground"
                      title={product.name}
                    >
                      {product.name}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {t('dashboard.licenses.no_products_assigned')}
              </p>
            )}
          </div>
          {showMore && (
            <>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">{t('general.created_at')}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(license.createdAt).toLocaleString(locale, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">{t('general.updated_at')}</h3>
                <p className="text-sm text-muted-foreground">
                  {new Date(license.updatedAt).toLocaleString(locale, {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <h3 className="font-semibold">{t('general.created_by')}</h3>
                <p className="text-sm font-semibold">
                  {license.createdBy ? (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 shrink-0" />
                      <Link
                        className="text-primary hover:underline"
                        href={`/dashboard/users/${license.createdBy.id}`}
                      >
                        {license.createdBy.fullName}
                      </Link>
                    </div>
                  ) : (
                    t('general.unknown')
                  )}
                </p>
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
