'use client';
import {
  ILicenseGetResponse,
  ILicenseGetSuccessResponse,
  ILicensesUpdateResponse,
} from '@/app/api/(dashboard)/licenses/[slug]/route';
import MetadataAside from '@/components/shared/misc/MetadataAside';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { LicenseModalProvider } from '@/providers/LicenseModalProvider';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { RequestsAreaChart } from '../../statistics/RequestsAreaChart';
import WorldMapChart from '../../statistics/WorldMapChart';
import CustomersPreviewTable from './CustomersPreviewTable';
import { LicenseDetails } from './LicenseDetails';
import ProductsPreviewTable from './ProductsPreviewTable';
import RequestLogsPreviewTable from './RequestLogsPreviewTable';

export default function LicenseView() {
  const params = useParams();
  const t = useTranslations();
  const router = useRouter();

  const licenseId = params.slug as string;
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

  const handleMetadataEdit = async ({
    metadata,
  }: {
    metadata: { key: string; value: string }[];
  }) => {
    const body = {
      suspended: license?.suspended,
      licenseKey: license?.licenseKey,
      productIds: license?.products.map((product) => product.id),
      customerIds: license?.customers.map((customer) => customer.id),
      expirationDate: license?.expirationDate,
      expirationDays: license?.expirationDays,
      expirationStart: null,
      ipLimit: license?.ipLimit,
      expirationType: license?.expirationType,
      metadata,
    } as Record<string, unknown>;

    if (license?.expirationType === 'DURATION') {
      body.expirationStart = license?.expirationStart;
    }

    const response = await fetch(`/api/licenses/${licenseId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as ILicensesUpdateResponse;

    if ('message' in data) {
      toast.error(data.message);
      return;
    }

    setLicense(
      (prev) =>
        ({
          ...prev,
          metadata: data.license.metadata,
        }) as ILicenseGetSuccessResponse['license'],
    );
  };

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
          <LicenseModalProvider>
            <div className="flex w-full gap-4 max-xl:flex-col-reverse">
              <div className="flex w-full max-w-full flex-col gap-4 overflow-auto">
                <ProductsPreviewTable licenseId={licenseId} />
                <CustomersPreviewTable licenseId={licenseId} />
                <RequestLogsPreviewTable licenseId={licenseId} />
                <RequestsAreaChart licenseId={licenseId} />
                <WorldMapChart licenseId={licenseId} />
              </div>
              <aside className="flex w-full max-w-96 flex-shrink-0 flex-col gap-4 max-xl:max-w-full">
                <LicenseDetails license={license} />
                <MetadataAside
                  handleMetadataEdit={handleMetadataEdit}
                  metadata={license?.metadata ?? null}
                />
              </aside>
            </div>
          </LicenseModalProvider>
        </div>
      </div>
    </>
  );
}
