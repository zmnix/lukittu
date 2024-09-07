'use client';
import {
  ILicenseGetResponse,
  ILicenseGetSuccessResponse,
} from '@/app/api/(dashboard)/licenses/[slug]/route';
import MetadataAside from '@/components/shared/misc/MetadataAside';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CustomersPreviewTable from './CustomersPreviewTable';
import { LicenseDetails } from './LicenseDetails';
import ProductsPreviewTable from './ProductsPreviewTable';
import RequestLogsPreviewTable from './RequestLogsPreviewTable';

export default function LicenseView() {
  const params = useParams();
  const t = useTranslations();
  const router = useRouter();

  const licenseId = params.slug;
  const [license, setLicense] = useState<
    ILicenseGetSuccessResponse['license'] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/licenses/${licenseId}`);
        const data = (await response.json()) as ILicenseGetResponse;

        if ('message' in data) {
          router.push('/dashboard/licenses');
          return toast.error(data.message);
        }

        setLicense(data.license);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
        router.push('/dashboard/licenses');
      } finally {
        setLoading(false);
      }
    })();
  }, [t, licenseId, router]);

  return (
    <>
      {loading ? (
        <Skeleton className="h-8 w-96" />
      ) : (
        <h1 className="truncate text-2xl font-bold">{license?.licenseKey}</h1>
      )}
      <Separator className="mt-2" />
      <div className="mt-6">
        <div className="flex">
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-8 w-96" />
            ))
          ) : (
            <div className="flex w-full gap-4 max-xl:flex-col">
              <div className="flex w-full max-w-full flex-col gap-4 overflow-auto">
                <ProductsPreviewTable license={license!} />
                <CustomersPreviewTable license={license!} />
                <RequestLogsPreviewTable license={license!} />
              </div>
              <aside className="flex w-full max-w-96 flex-shrink-0 flex-col gap-4 max-xl:max-w-full">
                <LicenseDetails license={license!} />
                <MetadataAside metadata={license!.metadata} />
              </aside>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
