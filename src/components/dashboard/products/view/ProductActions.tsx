'use client';
import { IProductGetResponse } from '@/app/api/(dashboard)/products/[slug]/route';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProductModalContext } from '@/providers/ProductModalProvider';
import { Edit, Ellipsis, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface ProductActionsProps {
  product: IProductGetResponse['product'] | null;
}
export default function ProductActions({ product }: ProductActionsProps) {
  const t = useTranslations();
  const ctx = useContext(ProductModalContext);

  const handleProductEdit = () => {
    ctx.setProductToEdit(product);
    ctx.setProductModalOpen(true);
  };

  const handleProductDelete = () => {
    ctx.setProductToDelete(product);
    ctx.setProductToDeleteModalOpen(true);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-medium" forceMount>
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={handleProductEdit}
        >
          <Edit className="mr-2 h-4 w-4" />
          {t('dashboard.products.edit_product')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive hover:cursor-pointer"
          onClick={handleProductDelete}
        >
          <Trash className="mr-2 h-4 w-4" />
          {t('dashboard.products.delete_product')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
