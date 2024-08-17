'use client';

import { Button } from '@/components/ui/button';
import { ProductModalContext } from '@/providers/ProductModalProvider';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

export default function AddProductButton() {
  const t = useTranslations();
  const ctx = useContext(ProductModalContext);

  return (
    <Button
      className="ml-auto"
      size="sm"
      variant="default"
      onClick={() => {
        ctx.setProductToEdit(null);
        ctx.setProductModalOpen(true);
      }}
    >
      <Plus className="mr-2 h-4 w-4" />
      {t('dashboard.products.add_product')}
    </Button>
  );
}
