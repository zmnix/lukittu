'use client';
import setProduct from '@/actions/products/set-product';
import LoadingButton from '@/components/shared/LoadingButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useModal } from '@/hooks/useModal';
import {
  SetProductSchema,
  setProductSchema,
} from '@/lib/validation/products/set-product-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

interface SetProductModalProps {
  open: boolean;
  onClose: () => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  products: Product[];
  product: Product | null;
}

export default function SetProductModal({
  open,
  onClose,
  setProducts,
  products,
  product,
}: SetProductModalProps) {
  const t = useTranslations();
  const { ConfirmModal, openConfirmModal } = useModal();
  const [pending, startTransition] = useTransition();

  const form = useForm<SetProductSchema>({
    resolver: zodResolver(setProductSchema(t)),
    defaultValues: {
      name: '',
      description: '',
      url: '',
    },
  });

  useEffect(() => {
    form.reset({
      id: product?.id,
      name: product?.name || '',
      description: product?.description || '',
      url: product?.url || '',
    });
  }, [form, product?.name, product?.description, product?.url, product?.id]);

  const onSubmit = (data: SetProductSchema) => {
    startTransition(async () => {
      const res = await setProduct(data);
      if (res.isError) {
        if (res.field) {
          return form.setError(res.field as keyof SetProductSchema, {
            type: 'manual',
            message: res.message,
          });
        }

        onClose();
        return openConfirmModal({
          title: t('general.error'),
          description: res.message,
        });
      }

      onClose();

      if (res.product) {
        const existingProduct = products.find((p) => p.id === product?.id);
        if (existingProduct) {
          setProducts(
            products.map((p) => (p.id === product?.id ? res.product : p)),
          );
        } else {
          setProducts([...products, res.product]);
        }
      }
    });
  };

  return (
    <>
      <ConfirmModal />
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {Boolean(product)
                ? t('dashboard.products.edit_product')
                : t('dashboard.products.add_product')}
            </DialogTitle>
            <DialogDescription>
              {t('dashboard.products.product_description')}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.name')} *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t(
                          'dashboard.products.my_first_product_placeholder',
                        )}
                        required
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.description')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} className="resize-none" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.url')}</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <button className="hidden" type="submit" />
            </form>
          </Form>
          <DialogFooter>
            <form action={onClose}>
              <LoadingButton className="w-full" type="submit" variant="outline">
                {t('general.close')}
              </LoadingButton>
            </form>
            <div>
              <LoadingButton
                className="w-full"
                pending={pending}
                type="submit"
                onClick={() => form.handleSubmit(onSubmit)()}
              >
                {t('dashboard.products.add_product')}
              </LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
