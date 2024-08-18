/* eslint-disable no-unused-vars */
'use client';
import CreateProductModal from '@/components/dashboard/products/CreateProductModal';
import { DeleteProductConfirmModal } from '@/components/dashboard/products/ProductDeleteConfirmModal';
import { Product } from '@prisma/client';
import { createContext, useState } from 'react';

export const ProductModalContext = createContext({
  setProductToDelete: (product: Product | null) => {},
  setProductModalOpen: (open: boolean) => {},
  setProductToDeleteModalOpen: (open: boolean) => {},
  productToDelete: null as Product | null,
  productToDeleteModalOpen: false,
  productModalOpen: false,
});

export const ProductModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [productToDeleteModalOpen, setProductToDeleteModalOpen] =
    useState(false);
  const [productModalOpen, setProductModalOpen] = useState(false);

  return (
    <ProductModalContext.Provider
      value={{
        setProductToDelete,
        setProductModalOpen,
        setProductToDeleteModalOpen,
        productToDelete,
        productToDeleteModalOpen,
        productModalOpen,
      }}
    >
      <CreateProductModal />
      <DeleteProductConfirmModal />
      {children}
    </ProductModalContext.Provider>
  );
};
