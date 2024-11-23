'use client';
import { ICustomersUpdateResponse } from '@/app/api/(dashboard)/customers/[slug]/route';
import { ICustomersCreateResponse } from '@/app/api/(dashboard)/customers/route';
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
  SetCustomerSchema,
  setCustomerSchema,
} from '@/lib/validation/customers/set-customer-schema';
import { CustomerModalContext } from '@/providers/CustomerModalProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

export default function SetCustomerModal() {
  const t = useTranslations();
  const ctx = useContext(CustomerModalContext);
  const [loading, setLoading] = useState(false);
  const { mutate } = useSWRConfig();

  const form = useForm<SetCustomerSchema>({
    resolver: zodResolver(setCustomerSchema(t)),
    defaultValues: {
      email: '',
      fullName: null,
      address: {
        city: null,
        country: null,
        line1: null,
        line2: null,
        postalCode: null,
        state: null,
      },
      metadata: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadata',
  });

  useEffect(() => {
    if (ctx.customerToEdit) {
      form.setValue('email', ctx.customerToEdit.email);
      form.setValue('fullName', ctx.customerToEdit.fullName);
      form.setValue('address.city', ctx.customerToEdit.address?.city ?? null);
      form.setValue(
        'address.country',
        ctx.customerToEdit.address?.country ?? null,
      );
      form.setValue('address.line1', ctx.customerToEdit.address?.line1 ?? null);
      form.setValue('address.line2', ctx.customerToEdit.address?.line2 ?? null);
      form.setValue(
        'address.postalCode',
        ctx.customerToEdit.address?.postalCode ?? null,
      );
      form.setValue('address.state', ctx.customerToEdit.address?.state ?? null);
      form.setValue(
        'metadata',
        (
          ctx.customerToEdit.metadata as {
            key: string;
            value: string;
            locked: boolean;
          }[]
        ).map((m) => ({
          key: m.key,
          value: m.value,
          locked: m.locked,
        })),
      );
    }
  }, [ctx.customerToEdit, form]);

  const handleCustomerCreate = async (payload: SetCustomerSchema) => {
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ICustomersCreateResponse;

    return data;
  };

  const handleCustomerEdit = async (payload: SetCustomerSchema) => {
    const response = await fetch(`/api/customers/${ctx.customerToEdit?.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ICustomersUpdateResponse;

    return data;
  };

  const onSubmit = async (data: SetCustomerSchema) => {
    setLoading(true);
    try {
      const res = ctx.customerToEdit
        ? await handleCustomerEdit(data)
        : await handleCustomerCreate(data);

      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof SetCustomerSchema, {
            type: 'manual',
            message: res.message,
          });
        }

        handleOpenChange(false);
        return toast.error(res.message);
      }

      mutate((key) => Array.isArray(key) && key[0] === '/api/customers');
      handleOpenChange(false);
      toast.success(
        ctx.customerToEdit
          ? t('dashboard.customers.customer_updated')
          : t('dashboard.customers.customer_created'),
      );
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleAddMetadata = () => {
    append({ key: '', value: '', locked: false });
  };

  const handleOpenChange = (open: boolean) => {
    ctx.setCustomerModalOpen(open);
    form.reset();
    if (!open) {
      ctx.setCustomerToEdit(null);
    }
  };

  return (
    <ResponsiveDialog
      open={ctx.customerModalOpen}
      onOpenChange={handleOpenChange}
    >
      <ResponsiveDialogContent className="sm:max-w-[625px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {t('dashboard.customers.add_customer')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t('dashboard.customers.customer_description')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form
            className="space-y-4 max-md:px-2"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('general.email')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="support@lukittu.com"
                      {...field}
                      required
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('general.full_name')}</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      onChange={(e) => {
                        if (!e.target.value) {
                          return form.setValue('fullName', null);
                        }
                        return form.setValue('fullName', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <h3 className="text-lg font-medium">{t('general.address')}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="address.line1"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('general.address_line1')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            if (!e.target.value) {
                              return form.setValue('address.line1', null);
                            }
                            return form.setValue(
                              'address.line1',
                              e.target.value,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.line2"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('general.address_line2')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            if (!e.target.value) {
                              return form.setValue('address.line2', null);
                            }
                            return form.setValue(
                              'address.line2',
                              e.target.value,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('general.city')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            if (!e.target.value) {
                              return form.setValue('address.city', null);
                            }
                            return form.setValue(
                              'address.city',
                              e.target.value,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('general.state')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            if (!e.target.value) {
                              return form.setValue('address.state', null);
                            }
                            return form.setValue(
                              'address.state',
                              e.target.value,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.postalCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('general.postal_code')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            if (!e.target.value) {
                              return form.setValue('address.postalCode', null);
                            }
                            return form.setValue(
                              'address.postalCode',
                              e.target.value,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="address.country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('general.country')}</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            if (!e.target.value) {
                              return form.setValue('address.country', null);
                            }
                            return form.setValue(
                              'address.country',
                              e.target.value,
                            );
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
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
              {t('dashboard.customers.add_customer')}
            </LoadingButton>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
