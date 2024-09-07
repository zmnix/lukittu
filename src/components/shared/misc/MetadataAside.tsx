import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { JsonValue } from '@prisma/client/runtime/library';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import MetadataEditModal from './MetadataEditModal';

interface MetadataAsideProps {
  metadata: JsonValue;
  handleMetadataEdit: ({
    metadata,
  }: {
    metadata: { key: string; value: string }[];
  }) => Promise<void>;
}

export default function MetadataAside({
  metadata,
  handleMetadataEdit,
}: MetadataAsideProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations();
  const metadataCasted = metadata as { key: string; value: string }[];

  return (
    <>
      <MetadataEditModal
        handleMetadataEdit={handleMetadataEdit}
        metadata={metadata}
        open={open}
        onOpenChange={setOpen}
      />
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-1 py-2">
          <CardTitle className="text-xl font-bold">
            {t('general.metadata')}
          </CardTitle>
          <Button
            className="mt-0"
            size="sm"
            variant="outline"
            onClick={() => setOpen(true)}
          >
            {t('general.edit')}
          </Button>
        </CardHeader>
        <Separator />
        <CardContent className="mt-4">
          <div className="flex flex-col gap-4">
            {metadataCasted.length ? (
              metadataCasted.map((item, index) => (
                <div key={index} className="flex flex-col gap-2">
                  <h3 className="break-all text-sm font-semibold">
                    {item.key}
                  </h3>
                  <p className="break-all text-sm text-muted-foreground">
                    {item.value}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
                {t('general.no_metadata')}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
