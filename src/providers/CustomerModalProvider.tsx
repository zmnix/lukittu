'use client';
import { DeleteCustomerConfirmModal } from '@/components/dashboard/customers/CustomerDeleteConfirmModal';
import SetCustomerModal from '@/components/dashboard/customers/list/SetCustomerModal';
import { Customer } from '@prisma/client';
import { createContext, useState } from 'react';

export const CustomerModalContext = createContext({
  setCustomerModalOpen: (open: boolean) => {},
  setCustomerToDelete: (customer: Customer | null) => {},
  setCustomerToEdit: (customer: Customer | null) => {},
  setCustomerToDeleteModalOpen: (open: boolean) => {},
  customerModalOpen: false,
  customerToDelete: null as Customer | null,
  customerToEdit: null as Customer | null,
  customerToDeleteModalOpen: false,
});

export const CustomerModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [customerToDeleteModalOpen, setCustomerToDeleteModalOpen] =
    useState(false);
  const [customerModalOpen, setCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(
    null,
  );

  return (
    <CustomerModalContext.Provider
      value={{
        setCustomerModalOpen,
        setCustomerToEdit,
        setCustomerToDelete,
        setCustomerToDeleteModalOpen,
        customerModalOpen,
        customerToEdit,
        customerToDelete,
        customerToDeleteModalOpen,
      }}
    >
      <DeleteCustomerConfirmModal />
      <SetCustomerModal />
      {children}
    </CustomerModalContext.Provider>
  );
};
