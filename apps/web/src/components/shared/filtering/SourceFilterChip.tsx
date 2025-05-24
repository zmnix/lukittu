import { Button } from '@/components/ui/button';
import { getSourceDisplayName } from '@/lib/utils/audit-helpers';
import { AuditLogSource } from '@lukittu/shared';
import { useTranslations } from 'next-intl';
import { FilterChip } from '../FilterChip';

type AuditLogSourceType = AuditLogSource | 'all';

interface SourceFilterChipProps {
  source: AuditLogSourceType;
  tempSource: AuditLogSourceType;
  setSource: (source: AuditLogSourceType) => void;
  setTempSource: (source: AuditLogSourceType) => void;
}

export function SourceFilterChip({
  source,
  tempSource,
  setSource,
  setTempSource,
}: SourceFilterChipProps) {
  const t = useTranslations();

  const sources = [
    AuditLogSource.DASHBOARD,
    AuditLogSource.API_KEY,
    AuditLogSource.DISCORD_INTEGRATION,
    AuditLogSource.STRIPE_INTEGRATION,
    AuditLogSource.BUILT_BY_BIT_INTEGRATION,
    AuditLogSource.POLYMART_INTEGRATION,
  ];

  return (
    <FilterChip
      activeValue={
        source !== 'all' ? getSourceDisplayName(source, t) : undefined
      }
      isActive={source !== 'all'}
      label={t('general.source')}
      popoverTitle={t('general.select_source')}
      onApply={() => setSource(tempSource)}
      onClear={() => {
        setTempSource(source);
      }}
      onReset={() => {
        setSource('all');
        setTempSource('all');
      }}
    >
      <div className="grid grid-cols-2 gap-2">
        <Button
          className="justify-start"
          variant={tempSource === 'all' ? 'default' : 'outline'}
          onClick={() => setTempSource('all')}
        >
          {t('general.all')}
        </Button>
        {sources.map((sourceValue) => (
          <Button
            key={sourceValue}
            className="justify-start"
            variant={tempSource === sourceValue ? 'default' : 'outline'}
            onClick={() => setTempSource(sourceValue)}
          >
            {getSourceDisplayName(sourceValue, t)}
          </Button>
        ))}
      </div>
    </FilterChip>
  );
}
