'use client';
import {
  IProductGetResponse,
  IProductGetSuccessResponse,
} from '@/app/api/(dashboard)/products/[slug]/route';
import MetadataAside from '@/components/shared/misc/MetadataAside';
import LicensesPreviewTable from '@/components/shared/table/preview/LicensesPreviewTable';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ProductModalProvider } from '@/providers/ProductModalProvider';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ProductsActionDropdown } from '../ProductsActionDropdown';
import { ProductDetails } from './ProductDetails';

export default function ProductView() {
  const params = useParams();
  const t = useTranslations();
  const router = useRouter();

  const productId = params.slug as string;
  const [product, setProduct] = useState<
    IProductGetSuccessResponse['product'] | null
  >(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const response = await fetch(`/api/products/${productId}`);
        const data = (await response.json()) as IProductGetResponse;

        if ('message' in data) {
          router.push('/dashboard/products');
          return toast.error(data.message);
        }

        setProduct(data.product);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
        router.push('/dashboard/products');
      } finally {
        setLoading(false);
      }
    })();
  }, [t, productId, router]);

  return (
    <ProductModalProvider>
      <div className="flex justify-between gap-2">
        {loading ? (
          <Skeleton className="h-8 w-96" />
        ) : (
          <h1 className="truncate text-2xl font-bold">{product?.name}</h1>
        )}
        <ProductsActionDropdown product={product!} variant="outline" />
      </div>
      <Separator className="mt-2" />
      <div className="mt-6">
        <div className="flex">
          <div className="flex w-full gap-4 max-xl:flex-col-reverse">
            <div className="flex w-full max-w-full flex-col gap-4 overflow-auto">
              <LicensesPreviewTable productId={productId} />
            </div>
            <aside className="flex w-full max-w-96 flex-shrink-0 flex-col gap-4 max-xl:max-w-full">
              <ProductDetails product={product} />
              <MetadataAside metadata={product?.metadata ?? null} />
            </aside>
          </div>
        </div>
      </div>
    </ProductModalProvider>
  );
}
