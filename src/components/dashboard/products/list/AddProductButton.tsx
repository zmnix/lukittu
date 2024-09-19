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
      className="ml-auto flex gap-2"
      size="sm"
      variant="default"
      onClick={() => ctx.setProductModalOpen(true)}
    >
      <Plus className="h-4 w-4" />
      <span className="max-md:hidden">
        {t('dashboard.products.add_product')}
      </span>
    </Button>
  );
}
