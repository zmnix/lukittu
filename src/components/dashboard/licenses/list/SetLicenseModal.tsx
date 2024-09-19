'use client';
import { ILicensesUpdateResponse } from '@/app/api/(dashboard)/licenses/[slug]/route';
import { ILicensesGenerateResponse } from '@/app/api/(dashboard)/licenses/generate/route';
import { ILicensesCreateResponse } from '@/app/api/(dashboard)/licenses/route';
import { CustomersAutocomplete } from '@/components/shared/form/CustomersAutocomplete';
import { ProductsAutocomplete } from '@/components/shared/form/ProductsAutocomplete';
import LoadingButton from '@/components/shared/LoadingButton';
import { Button } from '@/components/ui/button';
import { DateTimePicker } from '@/components/ui/date-time-picker';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils/tailwind-helpers';
import {
  SetLicenseScheama,
  setLicenseSchema,
} from '@/lib/validation/licenses/set-license-schema';
import { LicenseModalContext } from '@/providers/LicenseModalProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCw, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { useFieldArray, useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

export default function SetLicenseModal() {
  const t = useTranslations();
  const locale = useLocale();
  const ctx = useContext(LicenseModalContext);
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState<{
    license: boolean;
    product: boolean;
  }>({
    license: false,
    product: false,
  });

  const form = useForm<SetLicenseScheama>({
    resolver: zodResolver(setLicenseSchema(t)),
    defaultValues: {
      suspended: false,
      licenseKey: '',
      productIds: [],
      customerIds: [],
      expirationDate: null,
      expirationDays: null,
      expirationStart: null,
      ipLimit: null,
      expirationType: 'NEVER',
      metadata: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadata',
  });

  const expirationType = useWatch({
    control: form.control,
    name: 'expirationType',
    defaultValue: 'NEVER',
  });

  useEffect(() => {
    if (ctx.licenseToEdit) {
      form.setValue('suspended', ctx.licenseToEdit.suspended);
      form.setValue('licenseKey', ctx.licenseToEdit.licenseKey);
      form.setValue(
        'productIds',
        ctx.licenseToEdit.products.map((p) => p.id),
      );
      form.setValue(
        'customerIds',
        ctx.licenseToEdit.customers.map((c) => c.id),
      );
      form.setValue('expirationType', ctx.licenseToEdit.expirationType);

      if (ctx.licenseToEdit.expirationType === 'DATE') {
        form.setValue('expirationDate', ctx.licenseToEdit.expirationDate);
      }

      if (ctx.licenseToEdit.expirationType === 'DURATION') {
        form.setValue('expirationStart', ctx.licenseToEdit.expirationStart);
        form.setValue('expirationDays', ctx.licenseToEdit.expirationDays);
      }

      form.setValue('ipLimit', ctx.licenseToEdit.ipLimit);
      form.setValue(
        'metadata',
        (
          ctx.licenseToEdit.metadata as {
            key: string;
            value: string;
          }[]
        ).map((m) => ({
          key: m.key,
          value: m.value,
        })),
      );
    }
  }, [ctx.licenseToEdit, form]);

  const handleLicenseGenerate = async () => {
    setLoading((prev) => ({ ...prev, license: true }));
    try {
      const response = await fetch('/api/licenses/generate');
      const data = (await response.json()) as ILicensesGenerateResponse;
      const licenseKey = data.licenseKey;
      form.setValue('licenseKey', licenseKey, { shouldValidate: true });
    } catch (error: any) {
      toast.error(error.message ?? t('general.server_error'));
    } finally {
      setLoading((prev) => ({ ...prev, license: false }));
    }
  };

  const handleLicenseCreate = async (payload: SetLicenseScheama) => {
    const response = await fetch('/api/licenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ILicensesCreateResponse;

    return data;
  };

  const handleLicenseEdit = async (payload: SetLicenseScheama) => {
    const response = await fetch(`/api/licenses/${ctx.licenseToEdit?.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ILicensesUpdateResponse;

    return data;
  };

  const handleExpirationTypeChange = (type: 'NEVER' | 'DATE' | 'DURATION') => {
    form.setValue('expirationType', type);
    if (type === 'NEVER') {
      form.setValue('expirationDate', null);
      form.setValue('expirationDays', null);
      form.setValue('expirationStart', null);
    }
    if (type === 'DATE') {
      form.setValue('expirationDays', null);
      form.setValue('expirationStart', null);
    }
    if (type === 'DURATION') {
      form.setValue('expirationStart', 'CREATION');
      form.setValue('expirationDate', null);
    }
  };

  const onSubmit = async (data: SetLicenseScheama) => {
    setSubmitting(true);
    try {
      const res = ctx.licenseToEdit
        ? await handleLicenseEdit(data)
        : await handleLicenseCreate(data);

      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof SetLicenseScheama, {
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
        ctx.licenseToEdit
          ? t('dashboard.licenses.license_updated')
          : t('dashboard.licenses.license_created'),
      );
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMetadata = () => {
    append({ key: '', value: '' });
  };

  const handleOpenChange = (open: boolean) => {
    ctx.setLicenseModalOpen(open);
    form.reset();
    if (!open) {
      ctx.setLicenseToEdit(null);
    }
  };

  return (
    <>
      <ResponsiveDialog
        open={ctx.licenseModalOpen}
        onOpenChange={handleOpenChange}
      >
        <ResponsiveDialogContent className="sm:max-w-[625px]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t('dashboard.licenses.add_license')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t('dashboard.products.product_description')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Form {...form}>
            <form
              className="space-y-4 max-md:px-2"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="licenseKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.license')}</FormLabel>
                    <FormControl>
                      <div className="relative w-full">
                        <Input
                          disabled={loading.license}
                          placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                          {...field}
                        />
                        <Button
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          disabled={loading.license}
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={handleLicenseGenerate}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="space-y-2">
                <FormLabel>{t('dashboard.licenses.expiration_type')}</FormLabel>
                <div className="flex gap-2">
                  <Button
                    className={cn(
                      'w-full',
                      expirationType === 'NEVER' && 'border-2 border-primary',
                    )}
                    type="button"
                    variant="outline"
                    onClick={() => handleExpirationTypeChange('NEVER')}
                  >
                    {t('dashboard.licenses.never')}
                  </Button>
                  <Button
                    className={cn(
                      'w-full',
                      expirationType === 'DATE' && 'border-2 border-primary',
                    )}
                    type="button"
                    variant="outline"
                    onClick={() => handleExpirationTypeChange('DATE')}
                  >
                    {t('dashboard.licenses.date')}
                  </Button>
                  <Button
                    className={cn(
                      'w-full',
                      expirationType === 'DURATION' &&
                        'border-2 border-primary',
                    )}
                    type="button"
                    variant="outline"
                    onClick={() => handleExpirationTypeChange('DURATION')}
                  >
                    {t('dashboard.licenses.duration')}
                  </Button>
                </div>
              </div>
              {expirationType === 'DATE' && (
                <FormField
                  control={form.control}
                  name="expirationDate"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>
                        {t('dashboard.licenses.expiration_date')}
                      </FormLabel>
                      <FormControl>
                        <div className="relative w-full">
                          <DateTimePicker
                            granularity="minute"
                            hourCycle={locale === 'en' ? 12 : 24}
                            placeholder={t(
                              'dashboard.licenses.expiration_date',
                            )}
                            value={field.value ?? undefined}
                            onChange={(date) => {
                              if (!date) {
                                return form.setValue('expirationDate', null);
                              }
                              form.setValue('expirationDate', date);
                            }}
                          />
                          <Button
                            className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                            size="icon"
                            type="button"
                            variant="ghost"
                            onClick={() =>
                              form.setValue('expirationDate', null)
                            }
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {expirationType === 'DURATION' && (
                <>
                  <FormField
                    control={form.control}
                    name="expirationStart"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('dashboard.licenses.expiration_start')}
                        </FormLabel>
                        <Select
                          value={field.value ?? 'CREATION'}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select expiration start" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="CREATION">
                              {t('dashboard.licenses.creation')}
                            </SelectItem>
                            <SelectItem value="ACTIVATION">
                              {t('dashboard.licenses.activation')}
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="expirationDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {t('dashboard.licenses.expiration_days')}
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            min={1}
                            placeholder={t(
                              'dashboard.licenses.expiration_days',
                            )}
                            type="number"
                            value={field.value ?? ''}
                            onChange={(e) => {
                              if (!e.target.value || e.target.value === '0') {
                                return form.setValue('expirationDays', null);
                              }
                              form.setValue('expirationDays', +e.target.value);
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </>
              )}
              <FormField
                control={form.control}
                name="ipLimit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dashboard.licenses.ip_limit')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        min={1}
                        placeholder={t('dashboard.licenses.ip_limit')}
                        type="number"
                        value={field.value ?? ''}
                        onChange={(e) => {
                          if (!e.target.value || e.target.value === '0') {
                            return form.setValue('ipLimit', null);
                          }
                          form.setValue('ipLimit', +e.target.value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormItem>
                <FormLabel>
                  {t('dashboard.licenses.assigned_products')}
                </FormLabel>
                <ProductsAutocomplete
                  initialProducts={ctx.licenseToEdit?.products}
                  productIds={form.getValues('productIds')}
                  setProductIds={(productIds) =>
                    form.setValue('productIds', productIds)
                  }
                />
              </FormItem>

              <FormItem>
                <FormLabel>
                  {t('dashboard.licenses.assigned_customers')}
                </FormLabel>
                <CustomersAutocomplete
                  customerIds={form.getValues('customerIds')}
                  initialCustomers={ctx.licenseToEdit?.customers}
                  setCustomerIds={(customerIds) =>
                    form.setValue('customerIds', customerIds)
                  }
                />
              </FormItem>
              <FormField
                control={form.control}
                name="suspended"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>{t('general.suspended')}</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
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
                disabled={loading.license || loading.product}
                pending={submitting}
                onClick={() => form.handleSubmit(onSubmit)()}
              >
                {ctx.licenseToEdit
                  ? t('dashboard.licenses.edit_license')
                  : t('dashboard.licenses.add_license')}
              </LoadingButton>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
