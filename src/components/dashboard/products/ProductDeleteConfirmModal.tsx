/* eslint-disable no-unused-vars */
import deleteProduct from '@/actions/products/delete-product';
import LoadingButton from '@/components/shared/LoadingButton';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useModal } from '@/hooks/useModal';
import { Product } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

interface DeleteProductConfirmModalProps {
  product: Product | null;
  onClose: () => void;
}

export function DeleteProductConfirmModal({
  product,
  onClose,
}: DeleteProductConfirmModalProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [confirmName, setConfirmName] = useState('');
  const { ConfirmModal, openConfirmModal } = useModal();
  const router = useRouter();

  if (!product) return null;

  const handleDelete = async () => {
    startTransition(async () => {
      const res = await deleteProduct(product.id, confirmName);

      if (res.isError) {
        return openConfirmModal({
          title: t('general.error'),
          description: res.message,
        });
      }

      router.refresh();
      onClose();
    });
  };

  return (
    <>
      <ConfirmModal />
      <AlertDialog open={Boolean(product)} onOpenChange={onClose}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('dashboard.products.delete_product_confirm_title')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t.rich('dashboard.products.delete_product_confirm_description', {
                productName: product.name,
                strong: (child) => <strong>{child}</strong>,
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid w-full gap-1.5">
            <Label htmlFor="confirmName">
              {t.rich('dashboard.products.delete_product_confirm_input', {
                productName: `"${product.name.toUpperCase()}"`,
                code: (child) => (
                  <code className="text-xs font-semibold">{child}</code>
                ),
              })}
            </Label>
            <Input
              id="confirmName"
              onChange={(e) => setConfirmName(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              onClick={onClose}
            >
              {t('general.cancel')}
            </AlertDialogCancel>
            <LoadingButton
              className={buttonVariants({
                variant: 'destructive',
                size: 'sm',
              })}
              disabled={confirmName !== product.name.toUpperCase()}
              pending={pending}
              onClick={handleDelete}
            >
              {t('dashboard.products.delete_product')}
            </LoadingButton>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
