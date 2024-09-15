'use client';
import {
  ICustomerGetResponse,
  ICustomerGetSuccessResponse,
} from '@/app/api/(dashboard)/customers/[slug]/route';
import MetadataAside from '@/components/shared/misc/MetadataAside';
import LicensesPreviewTable from '@/components/shared/table/preview/LicensesPreviewTable';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { CustomerModalProvider } from '@/providers/CustomerModalProvider';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import CustomerActions from './CustomerActions';
import { CustomerDetails } from './CustomerDetails';

export default function CustomerView() {
  const params = useParams();
  const t = useTranslations();
  const router = useRouter();

  const customerId = params.slug as string;
  const [customer, setCustomer] = useState<
    ICustomerGetSuccessResponse['customer'] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/customers/${customerId}`);
        const data = (await response.json()) as ICustomerGetResponse;

        if ('message' in data) {
          router.push('/dashboard/customers');
          return toast.error(data.message);
        }

        setCustomer(data.customer);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
        router.push('/dashboard/customers');
      } finally {
        setLoading(false);
      }
    })();
  }, [t, customerId, router]);

  return (
    <CustomerModalProvider>
      <div className="flex justify-between gap-2 max-sm:flex-col">
        {loading ? (
          <Skeleton className="h-8 w-96" />
        ) : (
          <h1 className="truncate text-2xl font-bold">
            {customer?.fullName ?? customer?.email}
          </h1>
        )}
        <CustomerActions customer={customer} />
      </div>
      <Separator className="mt-2" />
      <div className="mt-6">
        <div className="flex">
          <div className="flex w-full gap-4 max-xl:flex-col-reverse">
            <div className="flex w-full max-w-full flex-col gap-4 overflow-auto">
              <LicensesPreviewTable customerId={customerId} />
            </div>
            <aside className="flex w-full max-w-96 flex-shrink-0 flex-col gap-4 max-xl:max-w-full">
              <CustomerDetails customer={customer} />
              <MetadataAside metadata={customer?.metadata ?? null} />
            </aside>
          </div>
        </div>
      </div>
    </CustomerModalProvider>
  );
}
