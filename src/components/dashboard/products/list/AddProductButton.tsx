'use client';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/tailwind-helpers';
import { ProductModalContext } from '@/providers/ProductModalProvider';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface AddProductButtonProps {
  displayText?: boolean;
}

export default function AddProductButton({
  displayText = false,
}: AddProductButtonProps) {
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
      <span
        className={cn('max-md:hidden', {
          'max-md:block': displayText,
        })}
      >
        {t('dashboard.products.add_product')}
      </span>
    </Button>
  );
}
