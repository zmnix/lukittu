'use client';
import { IBlacklistCreateResponse } from '@/app/api/(dashboard)/blacklist/route';
import CountrySelector from '@/components/shared/form/CountrySelector';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  SetBlacklistSchema,
  setBlacklistSchema,
} from '@/lib/validation/blacklist/set-blacklist-schema';
import { BlacklistModalContext } from '@/providers/BlacklistModalProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

export default function SetBlacklistModal() {
  const t = useTranslations();
  const ctx = useContext(BlacklistModalContext);
  const { mutate } = useSWRConfig();
  const [loading, setLoading] = useState(false);

  const form = useForm<SetBlacklistSchema>({
    resolver: zodResolver(setBlacklistSchema(t)),
    defaultValues: {
      metadata: [],
      type: 'IP_ADDRESS',
      value: '',
    },
  });

  const type = form.watch('type');

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadata',
  });

  useEffect(() => {
    if (ctx.blacklistToEdit) {
      form.setValue('type', ctx.blacklistToEdit.type);
      form.setValue('value', ctx.blacklistToEdit.value);
      form.setValue(
        'metadata',
        (
          ctx.blacklistToEdit.metadata as {
            key: string;
            value: string;
          }[]
        ).map((m) => ({
          key: m.key,
          value: m.value,
        })),
      );
    }
  }, [ctx.blacklistToEdit, form]);

  const handleBlacklistCreate = async (payload: SetBlacklistSchema) => {
    const response = await fetch('/api/blacklist', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as IBlacklistCreateResponse;

    return data;
  };

  const handleBlacklistEdit = async (payload: SetBlacklistSchema) => {
    const response = await fetch(`/api/blacklist/${ctx.blacklistToEdit?.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as IBlacklistCreateResponse;

    return data;
  };

  const onSubmit = async (data: SetBlacklistSchema) => {
    setLoading(true);
    try {
      const res = ctx.blacklistToEdit
        ? await handleBlacklistEdit(data)
        : await handleBlacklistCreate(data);

      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof SetBlacklistSchema, {
            type: 'manual',
            message: res.message,
          });
        }

        handleOpenChange(false);
        return toast.error(res.message);
      }

      mutate((key) => Array.isArray(key) && key[0] === '/api/blacklist');
      handleOpenChange(false);
      toast.success(
        ctx.blacklistToEdit
          ? t('dashboard.blacklist.blacklist_updated')
          : t('dashboard.blacklist.blacklist_created'),
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
    ctx.setBlacklistModalOpen(open);
    form.reset();
    if (!open) {
      ctx.setBlacklistToEdit(null);
    }
  };

  return (
    <>
      <ResponsiveDialog
        open={ctx.blacklistModalOpen}
        onOpenChange={handleOpenChange}
      >
        <ResponsiveDialogContent className="sm:max-w-[625px]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t('dashboard.blacklist.add_blacklist')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t('dashboard.blacklist.blacklist_description')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Form {...form}>
            <form
              className="space-y-4 max-md:px-2"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {t('dashboard.licenses.expiration_start')}
                    </FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('general.select_type')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="IP_ADDRESS">
                          {t('general.ip_address')}
                        </SelectItem>
                        <SelectItem value="DEVICE_IDENTIFIER">
                          {t('general.device_identifier')}
                        </SelectItem>
                        <SelectItem value="COUNTRY">
                          {t('general.country')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {type === 'COUNTRY' ? (
                <div className="space-y-2">
                  <FormLabel>{t('general.value')}</FormLabel>
                  <CountrySelector
                    value={form.getValues('value')}
                    onChange={(value) => form.setValue('value', value)}
                  />
                  {form.formState.errors.value && (
                    <div className="text-[0.8rem] text-destructive">
                      {form.formState.errors.value.message}
                    </div>
                  )}
                </div>
              ) : (
                <FormField
                  control={form.control}
                  name="value"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('general.value')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
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
                {ctx.blacklistToEdit
                  ? t('dashboard.blacklist.edit_blacklist')
                  : t('dashboard.blacklist.add_blacklist')}
              </LoadingButton>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
