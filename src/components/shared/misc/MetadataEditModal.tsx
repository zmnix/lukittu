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
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { metadataSchema } from '@/lib/validation/shared/metadata-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { JsonValue } from '@prisma/client/runtime/library';
import { X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { object } from 'zod';
import LoadingButton from '../LoadingButton';

interface MetadataEditModalProps {
  open: boolean;
  onOpenChange: (boolean: boolean) => void;
  metadata: JsonValue;
  handleMetadataEdit: ({
    metadata,
  }: {
    metadata: { key: string; value: string }[];
  }) => Promise<void>;
}

export default function MetadataEditModal({
  open,
  onOpenChange,
  metadata,
  handleMetadataEdit,
}: MetadataEditModalProps) {
  const t = useTranslations();
  const metadataCasted = metadata as { key: string; value: string }[];

  const [loading, setLoading] = useState(false);

  const form = useForm<{
    metadata: { key: string; value: string }[];
  }>({
    resolver: zodResolver(object({ metadata: metadataSchema(t) })),
    defaultValues: {
      metadata: [{ key: '', value: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadata',
  });

  useEffect(() => {
    if (metadataCasted.length) {
      form.reset({ metadata: metadataCasted });
    } else {
      form.reset({ metadata: [{ key: '', value: '' }] });
    }
  }, [metadataCasted, form]);

  const handleAddMetadata = () => {
    append({ key: '', value: '' });
  };

  const handleOpenChange = (open: boolean) => {
    form.reset();
    onOpenChange(open);
  };

  const onSubmit = async (data: {
    metadata: { key: string; value: string }[];
  }) => {
    setLoading(true);

    try {
      await handleMetadataEdit(data);
      handleOpenChange(false);
    } catch (error: any) {
      toast.error(error.message ?? t('general.server_error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[625px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('general.metadata')}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form className="max-md:px-4" onSubmit={form.handleSubmit(onSubmit)}>
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
                            disabled={fields.length === 1}
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
              {t('general.save')}
            </LoadingButton>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
