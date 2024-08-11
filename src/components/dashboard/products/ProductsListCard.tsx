'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@prisma/client';
import { Plus } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import CreateProductModal from './CreateProductModal';

export default function ProductsListCard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [addProductModalOpen, setAddProductModalOpen] = useState(false);
  const t = useTranslations();

  return (
    <>
      <CreateProductModal
        open={addProductModalOpen}
        setProducts={setProducts}
        onClose={() => setAddProductModalOpen(false)}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.products')}
            <Button
              className="ml-auto"
              size="sm"
              variant="default"
              onClick={() => setAddProductModalOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              {t('dashboard.products.add_product')}...
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent />
      </Card>
    </>
  );
}
