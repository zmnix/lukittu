'use client';
import { IProductsCreateResponse } from '@/app/api/products/route';
import LoadingButton from '@/components/shared/LoadingButton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useModal } from '@/hooks/useModal';
import {
  SetProductSchema,
  setProductSchema,
} from '@/lib/validation/products/set-product-schema';
import { ProductModalContext } from '@/providers/ProductModalProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useTransition } from 'react';
import { useForm } from 'react-hook-form';

export default function CreateProductModal() {
  const t = useTranslations();
  const ctx = useContext(ProductModalContext);
  const { ConfirmModal, openConfirmModal } = useModal();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SetProductSchema>({
    resolver: zodResolver(setProductSchema(t)),
    defaultValues: {
      name: '',
      description: '',
      url: '',
    },
  });

  const handleProductCreate = async (payload: SetProductSchema) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as IProductsCreateResponse;

    return data;
  };

  const onSubmit = (data: SetProductSchema) => {
    startTransition(async () => {
      const res = await handleProductCreate(data);
      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof SetProductSchema, {
            type: 'manual',
            message: res.message,
          });
        }

        ctx.setProductModalOpen(false);
        return openConfirmModal({
          title: t('general.error'),
          description: res.message,
        });
      }

      ctx.setProductModalOpen(false);
      form.reset();
      router.refresh();
    });
  };

  return (
    <>
      <ConfirmModal />
      <ResponsiveDialog
        open={ctx.productModalOpen}
        onOpenChange={ctx.setProductModalOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-[525px]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t('dashboard.products.add_product')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t('dashboard.products.product_description')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Form {...form}>
            <form
              className="space-y-4 px-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
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
          <ResponsiveDialogFooter>
            <div>
              <LoadingButton
                className="w-full"
                type="submit"
                variant="outline"
                onClick={() => ctx.setProductModalOpen(false)}
              >
                {t('general.close')}
              </LoadingButton>
            </div>
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
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
