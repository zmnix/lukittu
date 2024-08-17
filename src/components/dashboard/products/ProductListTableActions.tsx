'use client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductModalContext } from '@/providers/ProductModalProvider';
import { Product } from '@prisma/client';
import { EllipsisVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface ProductListTableActionsProps {
  product: Product;
}

export default function ProductListTableActions({
  product,
}: ProductListTableActionsProps) {
  const t = useTranslations();
  const ctx = useContext(ProductModalContext);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <EllipsisVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-medium" forceMount>
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={() => {
            ctx.setProductToEdit(product);
            ctx.setProductModalOpen(true);
          }}
        >
          {t('dashboard.products.edit_product')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive hover:cursor-pointer"
          onClick={() => ctx.setProductToDelete(product)}
        >
          {t('dashboard.products.delete_product')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
