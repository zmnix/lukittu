'use client';
import createProduct from '@/actions/products/create-product';
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
  CreateProductSchema,
  createProductSchema,
} from '@/lib/validation/products/create-product-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { Product } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

interface CreateProductModalProps {
  open: boolean;
  onClose: () => void;
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export default function CreateProductModal({
  open,
  onClose,
  setProducts,
}: CreateProductModalProps) {
  const t = useTranslations();
  const { ConfirmModal, openConfirmModal } = useModal();
  const [pending, startTransition] = useTransition();

  const form = useForm<CreateProductSchema>({
    resolver: zodResolver(createProductSchema(t)),
    defaultValues: {
      name: '',
      description: '',
      url: '',
    },
  });

  const onSubmit = (data: CreateProductSchema) => {
    startTransition(async () => {
      const res = await createProduct(data);
      if (res.isError) {
        if (res.field) {
          return form.setError(res.field as keyof CreateProductSchema, {
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

      setProducts((prev) => [...prev, res.product!]);
      onClose();
    });
  };

  return (
    <>
      <ConfirmModal />
      <Dialog open={open} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{t('dashboard.products.add_product')}</DialogTitle>
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
