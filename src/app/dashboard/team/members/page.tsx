import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Separator } from '@/components/ui/separator';
import { getTranslations } from 'next-intl/server';

export default async function TeamUsersPage() {
  const t = await getTranslations();
  return (
    <div>
      <Breadcrumb className="mb-2">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbPage>{t('dashboard.navigation.team')}</BreadcrumbPage>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{t('dashboard.navigation.members')}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <h1 className="text-2xl font-bold">
        {t('dashboard.navigation.members')}
      </h1>
      <Separator className="mt-2" />
    </div>
  );
}
