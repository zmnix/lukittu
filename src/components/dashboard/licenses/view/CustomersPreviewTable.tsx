import { ILicenseGetSuccessResponse } from '@/app/api/(dashboard)/licenses/[slug]/route';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface CustomersPreviewTableProps {
  license: ILicenseGetSuccessResponse['license'];
}
export default function CustomersPreviewTable({
  license,
}: CustomersPreviewTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          {t('dashboard.navigation.customers')}
          <Button className="ml-auto" size="sm" variant="outline">
            {t('dashboard.customers.add_customer')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {license.customers.length ? (
          <>
            <Table>
              <TableHeader>
                <TableHead className="truncate">{t('general.email')}</TableHead>
                <TableHead className="truncate">
                  {t('general.full_name')}
                </TableHead>
                <TableHead className="truncate">
                  {t('general.created_at')}
                </TableHead>
              </TableHeader>
              <TableBody>
                {license.customers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/customers/${customer.id}`)
                    }
                  >
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.fullName}</TableCell>
                    <TableCell>
                      {new Date(customer.createdAt).toLocaleString(locale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </>
        ) : (
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
            {t('dashboard.licenses.no_customers_assigned')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
