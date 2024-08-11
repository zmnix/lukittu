'use client';
import deleteProduct from '@/actions/products/delete-product';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useModal } from '@/hooks/useModal';
import { Product } from '@prisma/client';
import { EllipsisVertical, Package, Plus } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { DeleteProductConfirmModal } from './ProductDeleteConfirmModal';
import SetProductModal from './SetProductModal';

interface ProductListProps {
  products: Product[];
}

export default function ProductsListCard({
  products: initialProducts,
}: ProductListProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [productModalOpen, setProductModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const locale = useLocale();
  const t = useTranslations();
  const { ConfirmModal, openConfirmModal } = useModal();

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  const handleProductDelete = async (
    product: Product,
    productNameConfirmation: string,
  ) => {
    const res = await deleteProduct(product.id, productNameConfirmation);

    if (res.isError) {
      return openConfirmModal({
        title: t('general.error'),
        description: res.message,
      });
    }

    setProducts((prevProducts) =>
      prevProducts.filter((p) => p.id !== product.id),
    );
  };

  return (
    <>
      <ConfirmModal />
      <SetProductModal
        open={productModalOpen}
        product={productToEdit}
        products={products}
        setProducts={setProducts}
        onClose={() => {
          setProductToEdit(null);
          setProductModalOpen(false);
        }}
      />
      <DeleteProductConfirmModal
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
        onConfirm={handleProductDelete}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.products')}
            <Button
              className="ml-auto"
              size="sm"
              variant="default"
              onClick={() => {
                setProductToEdit(null);
                setProductModalOpen(true);
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.products.add_product')}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {products.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="truncate">
                    {t('general.name')}
                  </TableHead>
                  <TableHead className="truncate">
                    {t('general.created_at')}
                  </TableHead>
                  <TableHead className="truncate text-right">
                    {t('general.actions')}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell className="truncate">{product.name}</TableCell>
                    <TableCell
                      className="truncate"
                      title={new Date(product.createdAt).toLocaleString(locale)}
                    >
                      {new Date(product.createdAt).toLocaleString(locale, {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </TableCell>
                    <TableCell className="truncate py-0 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost">
                            <EllipsisVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="font-medium"
                          forceMount
                        >
                          <DropdownMenuItem
                            className="hover:cursor-pointer"
                            onClick={() => {
                              setProductToEdit(product);
                              setProductModalOpen(true);
                            }}
                          >
                            {t('dashboard.products.edit_product')}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive hover:cursor-pointer"
                            onClick={() => setProductToDelete(product)}
                          >
                            {t('dashboard.products.delete_product')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4">
                <div className="flex">
                  <span className="rounded-lg bg-secondary p-4">
                    <Package className="h-6 w-6" />
                  </span>
                </div>
                <h3 className="text-lg font-bold">
                  {t('dashboard.products.add_your_first_product')}
                </h3>
                <p className="max-w-sm text-center text-sm text-muted-foreground">
                  {t('dashboard.products.product_description')}
                </p>
                <div>
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      setProductToEdit(null);
                      setProductModalOpen(true);
                    }}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {t('dashboard.products.add_product')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
