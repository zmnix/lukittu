import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { metadataSchema } from '@/lib/validation/shared/metadata-schema';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FilterChip } from '../FilterChip';

interface MetadataFilterChipProps {
  metadataKey: string;
  metadataValue: string;
  tempMetadataKey: string;
  tempMetadataValue: string;
  setMetadataKey: (key: string) => void;
  setMetadataValue: (value: string) => void;
  setTempMetadataKey: (key: string) => void;
  setTempMetadataValue: (value: string) => void;
}

export function MetadataFilterChip({
  metadataKey,
  metadataValue,
  tempMetadataKey,
  tempMetadataValue,
  setMetadataKey,
  setMetadataValue,
  setTempMetadataKey,
  setTempMetadataValue,
}: MetadataFilterChipProps) {
  const t = useTranslations();

  return (
    <FilterChip
      activeValue={
        metadataKey && metadataValue
          ? `${metadataKey}: ${metadataValue}`
          : t('general.metadata')
      }
      disabled={Boolean(!tempMetadataKey || !tempMetadataValue)}
      isActive={Boolean(metadataKey && metadataValue)}
      label={t('general.metadata')}
      popoverTitle={t('general.metadata')}
      onApply={async () => {
        try {
          await metadataSchema(t).parseAsync([
            {
              key: tempMetadataKey,
              value: tempMetadataValue,
              locked: false,
            },
          ]);
          setMetadataKey(tempMetadataKey);
          setMetadataValue(tempMetadataValue);
        } catch (error) {
          setTempMetadataKey('');
          setTempMetadataValue('');
          toast.error(t('validation.invalid_metadata'));
        }
      }}
      onClear={() => {
        setTempMetadataKey(metadataKey);
        setTempMetadataValue(metadataValue);
      }}
      onReset={() => {
        setMetadataKey('');
        setMetadataValue('');
        setTempMetadataKey('');
        setTempMetadataValue('');
      }}
    >
      <div className="flex flex-col gap-4">
        <div>
          <Label htmlFor="metadata-key">{t('general.key')}</Label>
          <Input
            className="mt-2"
            id="metadata-key"
            placeholder={t('general.key')}
            value={tempMetadataKey}
            onChange={(e) => setTempMetadataKey(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="metadata-value">{t('general.value')}</Label>
          <Input
            className="mt-2"
            id="metadata-value"
            placeholder={t('general.value')}
            value={tempMetadataValue}
            onChange={(e) => setTempMetadataValue(e.target.value)}
          />
        </div>
      </div>
    </FilterChip>
  );
}
