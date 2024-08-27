'use client';
import { ILicensesGenerateResponse } from '@/app/api/licenses/generate/route';
import { IProductsGetResponse } from '@/app/api/products/route';
import LoadingButton from '@/components/shared/LoadingButton';
import { LoadingSpinner } from '@/components/shared/LoadingSpinner';
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
import MultipleSelector from '@/components/ui/multiple-selector';
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
import { cn } from '@/lib/utils/tailwind-helpers';
import {
  SetLicenseScheama,
  setLicenseSchema,
} from '@/lib/validation/licenses/set-license-schema';
import { LicenseModalContext } from '@/providers/LicenseModalProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { RefreshCw, X } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useContext, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';

export default function CreateLicenseModal() {
  const t = useTranslations();
  const locale = useLocale();
  const ctx = useContext(LicenseModalContext);

  const [loadingLicense, startLicenseTransition] = useTransition();
  const [pending, startTransition] = useTransition();

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
    },
  });

  const expirationType = useWatch({
    control: form.control,
    name: 'expirationType',
    defaultValue: 'NEVER',
  });

  const fetchLicenseKey = () => {
    startLicenseTransition(async () => {
      try {
        const response = await fetch('/api/licenses/generate');
        const data = (await response.json()) as ILicensesGenerateResponse;
        const licenseKey = data.licenseKey;
        form.setValue('licenseKey', licenseKey, { shouldValidate: true });
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      }
    });
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

  const onSubmit = (data: SetLicenseScheama) => {
    startTransition(() => {
      //
    });
  };

  return (
    <>
      <ResponsiveDialog
        open={ctx.licenseModalOpen}
        onOpenChange={ctx.setLicenseModalOpen}
      >
        <ResponsiveDialogContent className="sm:max-w-[525px]">
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
              className="space-y-4 px-4"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="licenseKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('dashboard.licenses.license')}</FormLabel>
                    <FormControl>
                      <div className="relative w-full">
                        <Input
                          disabled={loadingLicense}
                          placeholder="XXXXX-XXXXX-XXXXX-XXXXX-XXXXX"
                          {...field}
                        />
                        <Button
                          className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
                          disabled={loadingLicense}
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={fetchLicenseKey}
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
                {/* Label */}
                <FormLabel>{t('dashboard.licenses.expiration_type')}</FormLabel>
                {/* Buttons */}
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
                            hourCycle={locale === 'en' ? 12 : 24}
                            placeholder={t(
                              'dashboard.licenses.expiration_date',
                            )}
                            value={field.value ?? undefined}
                            onChange={field.onChange}
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
                <MultipleSelector
                  defaultOptions={[]}
                  emptyIndicator={
                    <div className="flex">{t('general.no_results')}</div>
                  }
                  loadingIndicator={
                    <div className="flex items-center justify-center py-2">
                      <LoadingSpinner />
                    </div>
                  }
                  placeholder={t('dashboard.licenses.search_product')}
                  triggerSearchOnFocus
                  onChange={(value) => {
                    form.setValue(
                      'productIds',
                      value.map((product) => parseInt(product.value)),
                    );
                  }}
                  onSearch={async (value) => {
                    const response = await fetch(
                      `/api/products?search=${value}`,
                    );
                    const data =
                      (await response.json()) as IProductsGetResponse;

                    if ('message' in data) {
                      toast.error(data.message);
                      return [];
                    }

                    const results = data.products.map((product) => ({
                      label: product.name,
                      value: product.id.toString(),
                    }));

                    return results;
                  }}
                />
              </FormItem>
              <button className="hidden" type="submit" />
            </form>
          </Form>
          <ResponsiveDialogFooter>
            <div>
              <LoadingButton
                className="w-full"
                type="submit"
                variant="outline"
                onClick={() => ctx.setLicenseModalOpen(false)}
              >
                {t('general.close')}
              </LoadingButton>
            </div>
            <div>
              <LoadingButton
                className="w-full"
                disabled={loadingLicense}
                pending={pending}
                onClick={() => form.handleSubmit(onSubmit)()}
              >
                {t('dashboard.licenses.add_license')}
              </LoadingButton>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
