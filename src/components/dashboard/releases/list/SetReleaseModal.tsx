'use client';
import { IProductsReleasesCreateResponse } from '@/app/api/(dashboard)/products/releases/route';
import { ProductSelector } from '@/components/shared/form/ProductSelector';
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
import { Label } from '@/components/ui/label';
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
  setReleaseSchema,
  SetReleaseSchema,
} from '@/lib/validation/products/set-release-schema';
import { ReleaseModalContext } from '@/providers/ReleasesModalProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { FileIcon, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext, useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { useSWRConfig } from 'swr';

export default function SetReleaseModal() {
  const t = useTranslations();
  const ctx = useContext(ReleaseModalContext);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const { mutate } = useSWRConfig();

  const form = useForm<SetReleaseSchema>({
    resolver: zodResolver(setReleaseSchema(t)),
    defaultValues: {
      status: 'DRAFT',
      version: '',
      metadata: [],
      productId: '',
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadata',
  });

  useEffect(() => {
    if (ctx.releaseToEdit) {
      form.setValue('version', ctx.releaseToEdit.version);
      form.setValue('status', ctx.releaseToEdit.status);
      form.setValue('productId', ctx.releaseToEdit.productId);
      form.setValue(
        'metadata',
        (
          ctx.releaseToEdit.metadata as {
            key: string;
            value: string;
          }[]
        ).map((m) => ({
          key: m.key,
          value: m.value,
        })),
      );
    }
  }, [ctx.releaseToEdit, form]);

  const handleReleaseCreate = async (payload: SetReleaseSchema) => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }

    const jsonPayload = JSON.stringify(payload);
    formData.append('data', jsonPayload);

    const response = await fetch('/api/products/releases', {
      method: 'POST',
      body: formData,
    });

    const data = (await response.json()) as IProductsReleasesCreateResponse;

    return data;
  };

  const handleReleaseUpdate = async (payload: SetReleaseSchema) => {
    const formData = new FormData();
    if (file) {
      formData.append('file', file);
    }

    const jsonPayload = JSON.stringify(payload);
    formData.append('data', jsonPayload);

    const response = await fetch(
      `/api/products/releases/${ctx.releaseToEdit?.id}`,
      {
        method: 'PUT',
        body: formData,
      },
    );

    const data = (await response.json()) as IProductsReleasesCreateResponse;

    return data;
  };

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = false;
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 1048576) {
          return toast.error(t('validation.file_too_large'));
        }
        setFile(file);
      }
    };
    input.click();
  };

  const onSubmit = async (data: SetReleaseSchema) => {
    setLoading(true);
    try {
      const res = ctx.releaseToEdit
        ? await handleReleaseUpdate(data)
        : await handleReleaseCreate(data);

      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof SetReleaseSchema, {
            type: 'manual',
            message: res.message,
          });
        }

        handleOpenChange(false);
        return toast.error(res.message);
      }

      mutate(
        (key) => Array.isArray(key) && key[0] === '/api/products/releases',
      );
      handleOpenChange(false);
      toast.success(
        ctx.releaseToEdit
          ? t('dashboard.releases.release_updated')
          : t('dashboard.releases.release_created'),
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
    ctx.setReleaseModalOpen(open);
    form.reset();
    setFile(null);
    if (!open) {
      ctx.setReleaseToEdit(null);
    }
  };

  return (
    <>
      <ResponsiveDialog
        open={ctx.releaseModalOpen}
        onOpenChange={handleOpenChange}
      >
        <ResponsiveDialogContent className="sm:max-w-[625px]">
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t('dashboard.releases.create_release')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t('dashboard.releases.release_description')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <Form {...form}>
            <form
              className="space-y-4 max-md:px-2"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <FormItem>
                <Label
                  className={
                    form.formState.errors.productId ? 'text-destructive' : ''
                  }
                >
                  {t('general.product')} *
                </Label>
                <ProductSelector
                  initialValue={ctx.releaseToEdit?.productId}
                  onChange={(productId) =>
                    form.setValue('productId', productId ?? '', {
                      shouldValidate: true,
                    })
                  }
                />
                {form.formState.errors.productId && (
                  <FormMessage>
                    {form.formState.errors.productId.message}
                  </FormMessage>
                )}
              </FormItem>
              <FormField
                control={form.control}
                name="version"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.version')} *</FormLabel>
                    <FormControl>
                      <Input placeholder="v1.0.0" required {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.status')} *</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue
                            placeholder={t('general.select_status')}
                          />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="DRAFT">
                          {t('general.draft')}
                        </SelectItem>
                        <SelectItem value="PUBLISHED">
                          {t('general.published')}
                        </SelectItem>
                        <SelectItem value="DEPRECATED">
                          {t('general.deprecated')}
                        </SelectItem>
                        <SelectItem value="ARCHIVED">
                          {t('general.archived')}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormItem>
                <Label>{t('general.file')}</Label>
                {!file ? (
                  <div
                    className="flex cursor-pointer flex-col items-center gap-1 rounded-lg border-2 border-dashed p-6"
                    onClick={handleFileSelect}
                  >
                    <FileIcon className="h-12 w-12" />
                    <span className="text-sm font-medium text-muted-foreground">
                      {t('dashboard.releases.click_here_to_upload')}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {t('dashboard.releases.supported_file_types')}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 rounded-lg border px-2 py-1">
                    <span className="flex w-full items-center gap-2">
                      <FileIcon className="h-8 w-8" />
                      <span className="text-sm font-medium text-muted-foreground">
                        {file.name} (
                        {file.size > 1024
                          ? file.size > 1048576
                            ? file.size > 1073741824
                              ? `${(file.size / 1073741824).toFixed(2)} GB`
                              : `${(file.size / 1048576).toFixed(2)} MB`
                            : `${(file.size / 1024).toFixed(2)} KB`
                          : `${file.size} B`}
                        )
                      </span>
                    </span>
                    <Button
                      className="shrink-0 pl-0"
                      size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => setFile(null)}
                    >
                      <X size={24} />
                    </Button>
                  </div>
                )}
              </FormItem>
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
                {ctx.releaseToEdit
                  ? t('dashboard.releases.update_release')
                  : t('dashboard.releases.create_release')}
              </LoadingButton>
            </div>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
