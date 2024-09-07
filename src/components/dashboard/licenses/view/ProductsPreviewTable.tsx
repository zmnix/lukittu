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
import { LicenseModalContext } from '@/providers/LicenseModalProvider';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext } from 'react';

interface ProductsPreviewTableProps {
  license: ILicenseGetSuccessResponse['license'];
}
export default function ProductsPreviewTable({
  license,
}: ProductsPreviewTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();
  const ctx = useContext(LicenseModalContext);

  const handleAddProduct = () => {
    ctx.setLicenseToEdit(license);
    ctx.setLicenseModalOpen(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          {t('dashboard.navigation.products')}
          <Button
            className="ml-auto"
            size="sm"
            variant="outline"
            onClick={handleAddProduct}
          >
            {t('dashboard.products.add_product')}
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {license.products.length ? (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="truncate">
                    {t('general.name')}
                  </TableHead>
                  <TableHead className="truncate">
                    {t('general.created_at')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {license.products.map((product) => (
                  <TableRow
                    key={product.id}
                    className="cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/products/${product.id}`)
                    }
                  >
                    <TableCell>{product.name}</TableCell>
                    <TableCell>
                      {new Date(product.createdAt).toLocaleString(locale, {
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
            {t('dashboard.licenses.no_products_assigned')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
