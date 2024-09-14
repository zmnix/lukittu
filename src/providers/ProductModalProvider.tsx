'use client';
import { DeleteProductConfirmModal } from '@/components/dashboard/products/ProductDeleteConfirmModal';
import SetProductModal from '@/components/dashboard/products/list/SetProductModal';
import { Product } from '@prisma/client';
import { createContext, useState } from 'react';

export const ProductModalContext = createContext({
  setProductToDelete: (product: Product | null) => {},
  setProductToEdit: (product: Product | null) => {},
  setProductModalOpen: (open: boolean) => {},
  setProductToDeleteModalOpen: (open: boolean) => {},
  productToEdit: null as Product | null,
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
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [productModalOpen, setProductModalOpen] = useState(false);

  return (
    <ProductModalContext.Provider
      value={{
        setProductToDelete,
        setProductModalOpen,
        setProductToDeleteModalOpen,
        setProductToEdit,
        productToEdit,
        productToDelete,
        productToDeleteModalOpen,
        productModalOpen,
      }}
    >
      <SetProductModal />
      <DeleteProductConfirmModal />
      {children}
    </ProductModalContext.Provider>
  );
};
