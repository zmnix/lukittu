/* eslint-disable no-unused-vars */
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
import { Product } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';

interface DeleteProductConfirmModalProps {
  product: Product | null;
  onClose: () => void;
  onConfirm: (
    product: Product,
    productNameConfirmation: string,
  ) => Promise<void>;
}

export function DeleteProductConfirmModal({
  product,
  onClose,
  onConfirm,
}: DeleteProductConfirmModalProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [confirmName, setConfirmName] = useState('');

  if (!product) return null;

  const handleConfirm = async () => {
    startTransition(async () => {
      await onConfirm(product, confirmName);
      onClose();
    });
  };

  return (
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
            onClick={handleConfirm}
          >
            {t('dashboard.products.delete_product')}
          </LoadingButton>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
