import { IDeleteProductResponse } from '@/app/api/products/[slug]/route';
import LoadingButton from '@/components/shared/LoadingButton';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { useModal } from '@/hooks/useModal';
import { ProductModalContext } from '@/providers/ProductModalProvider';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useState, useTransition } from 'react';

export function DeleteProductConfirmModal() {
  const t = useTranslations();
  const ctx = useContext(ProductModalContext);
  const [pending, startTransition] = useTransition();
  const [productNameConfirmation, setProductNameConfirmation] = useState('');
  const { ConfirmModal, openConfirmModal } = useModal();
  const router = useRouter();

  const product = ctx.productToDelete;

  if (!product) return null;

  const handleDeleteProduct = async (
    productId: number,
    productNameConfirmation: string,
  ) => {
    const response = await fetch(`/api/products/${productId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ productNameConfirmation }),
    });

    const responseData = (await response.json()) as IDeleteProductResponse;

    return responseData;
  };

  const handleDelete = async () => {
    startTransition(async () => {
      const res = await handleDeleteProduct(
        product.id,
        productNameConfirmation,
      );

      if ('message' in res) {
        return openConfirmModal({
          title: t('general.error'),
          description: res.message,
        });
      }

      router.refresh();
      ctx.setProductToDelete(null);
      ctx.setProductToDeleteModalOpen(false);
    });
  };

  return (
    <>
      <ConfirmModal />
      <ResponsiveDialog
        open={ctx.productToDeleteModalOpen}
        onOpenChange={ctx.setProductToDeleteModalOpen}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t('dashboard.products.delete_product_confirm_title')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t.rich('dashboard.products.delete_product_confirm_description', {
                productName: product.name,
                strong: (child) => <strong>{child}</strong>,
              })}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="grid w-full gap-1.5 px-4">
            <Label htmlFor="productNameConfirmation">
              {t.rich('dashboard.products.delete_product_confirm_input', {
                productName: `"${product.name.toUpperCase()}"`,
                code: (child) => (
                  <code className="text-xs font-semibold">{child}</code>
                ),
              })}
            </Label>
            <Input
              id="productNameConfirmation"
              onChange={(e) => setProductNameConfirmation(e.target.value)}
            />
          </div>
          <ResponsiveDialogFooter>
            <LoadingButton
              size="sm"
              variant="outline"
              onClick={() => {
                ctx.setProductToDeleteModalOpen(false);
                ctx.setProductToDelete(null);
              }}
            >
              {t('general.cancel')}
            </LoadingButton>
            <LoadingButton
              disabled={productNameConfirmation !== product.name.toUpperCase()}
              pending={pending}
              size="sm"
              variant="destructive"
              onClick={handleDelete}
            >
              {t('dashboard.products.delete_product')}
            </LoadingButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
