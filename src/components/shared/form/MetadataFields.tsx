'use client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Lock, Unlock, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useFieldArray, UseFormReturn } from 'react-hook-form';

interface MetadataFieldsProps {
  form: UseFormReturn<any>;
}

export default function MetadataFields({ form }: MetadataFieldsProps) {
  const t = useTranslations();
  const [unlockIndex, setUnlockIndex] = useState<number | null>(null);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'metadata',
  });

  const handleUnlockConfirm = () => {
    if (unlockIndex !== null) {
      form.setValue(`metadata.${unlockIndex}.locked`, false, {
        shouldDirty: true,
        shouldTouch: true,
      });
      setUnlockIndex(null);
    }
  };

  const handleToggleLock = (index: number, event: React.MouseEvent) => {
    event.preventDefault();
    const metadata = form.watch('metadata');

    if (metadata[index].locked) {
      setUnlockIndex(index);
    } else {
      form.setValue(`metadata.${index}.locked`, true, {
        shouldDirty: true,
        shouldTouch: true,
      });
    }
  };

  const handleAddMetadata = () => {
    append({ key: '', value: '', locked: false });
  };

  return (
    <>
      {fields.map((field, index) => (
        <div key={field.id} className="flex items-start gap-2">
          <FormField
            control={form.control}
            name={`metadata.${index}.key`}
            render={({ field }) => (
              <FormItem className="w-[calc(100%-130px)]">
                <FormLabel>
                  {t('general.key')} {index + 1}
                </FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    className={
                      form.watch(`metadata.${index}.locked`) ? 'bg-muted' : ''
                    }
                    disabled={form.watch(`metadata.${index}.locked`)}
                  />
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
                    <Input
                      {...field}
                      className={
                        form.watch(`metadata.${index}.locked`) ? 'bg-muted' : ''
                      }
                      disabled={form.watch(`metadata.${index}.locked`)}
                    />
                    <Button
                      className="shrink-0"
                      size="icon"
                      type="button"
                      variant="secondary"
                      onClick={(e) => handleToggleLock(index, e)}
                    >
                      {form.watch(`metadata.${index}.locked`) ? (
                        <Lock className="h-4 w-4" />
                      ) : (
                        <Unlock className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      className="shrink-0"
                      disabled={form.watch(`metadata.${index}.locked`)}
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

      <AlertDialog
        open={unlockIndex !== null}
        onOpenChange={() => setUnlockIndex(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('general.unlock_metadata')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('general.locked_metadata_warning')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('general.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleUnlockConfirm}>
              {t('general.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
