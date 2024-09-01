import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { getTranslations } from 'next-intl/server';
import Link from 'next/link';

export default async function LicensePage() {
  const t = await getTranslations();
  return (
    <div>
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard/licenses">
                {t('dashboard.navigation.licenses')}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-bold">XXXXX-XXXXX-XXXXX-XXXXX-XXXXX</h1>
      <Separator className="mt-2" />
    </div>
  );
}
