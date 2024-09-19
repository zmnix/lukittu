'use client';
import { IProductsGetSuccessResponse } from '@/app/api/(dashboard)/products/route';
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

interface ProductsActionDropdownProps {
  product: IProductsGetSuccessResponse['products'][number];
}

export const ProductsActionDropdown = ({
  product,
}: ProductsActionDropdownProps) => {
  const t = useTranslations();
  const ctx = useContext(ProductModalContext);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="ghost">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-medium" forceMount>
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            ctx.setProductToEdit(product);
            ctx.setProductModalOpen(true);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          {t('dashboard.products.edit_product')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            ctx.setProductToDelete(product);
            ctx.setProductToDeleteModalOpen(true);
          }}
        >
          <Trash className="mr-2 h-4 w-4" />
          {t('dashboard.products.delete_product')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
