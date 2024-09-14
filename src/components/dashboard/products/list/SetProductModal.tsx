'use client';
import { IProductsCreateResponse } from '@/app/api/(dashboard)/products/route';
import LoadingButton from '@/components/shared/LoadingButton';
import { Button } from '@/components/ui/button';
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
import {
  SetProductSchema,
  setProductSchema,
} from '@/lib/validation/products/set-product-schema';
import { ProductModalContext } from '@/providers/ProductModalProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';

export default function SetProductModal() {
  const t = useTranslations();
  const ctx = useContext(ProductModalContext);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<SetProductSchema>({
    resolver: zodResolver(setProductSchema(t)),
    defaultValues: {
      name: '',
      url: '',
      metadata: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadata',
  });

  useEffect(() => {
    if (ctx.productToEdit) {
      form.reset({
        name: ctx.productToEdit.name,
        url: ctx.productToEdit.url ?? '',
        metadata:
          (ctx.productToEdit.metadata as { key: string; value: string }[]) ??
          [],
      });
    }
  }, [ctx.productToEdit, form]);

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

  const handleProductEdit = async (payload: SetProductSchema) => {
    const response = await fetch(`/api/products/${ctx.productToEdit?.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as IProductsCreateResponse;

    return data;
  };

  const onSubmit = async (data: SetProductSchema) => {
    setLoading(true);
    try {
      const res = ctx.productToEdit
        ? await handleProductEdit(data)
        : await handleProductCreate(data);

      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof SetProductSchema, {
            type: 'manual',
            message: res.message,
          });
        }

        handleOpenChange(false);
        return toast.error(res.message);
      }

      router.refresh();
      handleOpenChange(false);
      toast.success(
        ctx.productToEdit
          ? t('dashboard.products.product_updated')
          : t('dashboard.products.product_created'),
      );
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetadata = () => {
    append({ key: '', value: '' });
  };

  const handleOpenChange = (open: boolean) => {
    ctx.setProductModalOpen(open);
    form.reset();
  };

  return (
    <>
      <ResponsiveDialog
        open={ctx.productModalOpen}
        onOpenChange={handleOpenChange}
      >
        <ResponsiveDialogContent className="sm:max-w-[625px]">
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
              className="space-y-4 max-md:px-4"
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
              {fields.map((field, index) => (
                <div key={field.id} className="flex items-start gap-2">
                  <FormField
                    control={form.control}
                    name={`metadata.${index}.key`}
                    render={({ field }) => (
                      <FormItem className="w-[calc(100%-90px)]">
                        <FormLabel>
                          {t('general.key')} {index + 1}
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`metadata.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="w-full">
                        <FormLabel>
                          {t('general.value')} {index + 1}
                        </FormLabel>
                        <FormControl>
                          <div className="flex items-center gap-2">
                            <Input {...field} />
                            <Button
                              className="shrink-0 pl-0"
                              size="icon"
                              type="button"
                              variant="secondary"
                              onClick={() => remove(index)}
                            >
                              <X size={24} />
                            </Button>
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ))}
              <Button
                className="pl-0"
                size="sm"
                type="button"
                variant="link"
                onClick={handleAddMetadata}
              >
                {t('general.add_metadata')}
              </Button>
              <button className="hidden" type="submit" />
            </form>
          </Form>
          <ResponsiveDialogFooter>
            <div>
              <LoadingButton
                className="w-full"
                type="submit"
                variant="outline"
                onClick={() => handleOpenChange(false)}
              >
                {t('general.close')}
              </LoadingButton>
            </div>
            <div>
              <LoadingButton
                className="w-full"
                pending={loading}
                type="submit"
                onClick={() => form.handleSubmit(onSubmit)()}
              >
                {ctx.productToEdit
                  ? t('dashboard.products.edit_product')
                  : t('dashboard.products.add_product')}
              </LoadingButton>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
