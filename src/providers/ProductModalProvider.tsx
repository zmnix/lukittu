/* eslint-disable no-unused-vars */
'use client';
import { DeleteProductConfirmModal } from '@/components/dashboard/products/ProductDeleteConfirmModal';
import SetProductModal from '@/components/dashboard/products/SetProductModal';
import { Product } from '@prisma/client';
import { createContext, useState } from 'react';

export const ProductModalContext = createContext({
  setProductToEdit: (product: Product | null) => {},
  setProductToDelete: (product: Product | null) => {},
  setProductModalOpen: (open: boolean) => {},
});

export const ProductModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  return (
    <ProductModalContext.Provider
      value={{ setProductToEdit, setProductToDelete, setProductModalOpen }}
    >
      <SetProductModal
        open={productModalOpen}
        product={productToEdit}
        onClose={() => {
          setProductModalOpen(false);
          setProductToEdit(null);
        }}
      />
      <DeleteProductConfirmModal
        product={productToDelete}
        onClose={() => setProductToDelete(null)}
      />
      {children}
    </ProductModalContext.Provider>
  );
};
