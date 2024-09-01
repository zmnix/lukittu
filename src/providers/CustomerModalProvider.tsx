'use client';
import CreateCustomerModal from '@/components/dashboard/customers/CreateCustomerModal';
import { createContext, useState } from 'react';

export const CustomerModalContext = createContext({
  setCustomerModalOpen: (open: boolean) => {},
  customerModalOpen: false,
});

export const CustomerModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [customerModalOpen, setCustomerModalOpen] = useState(false);

  return (
    <CustomerModalContext.Provider
      value={{
        setCustomerModalOpen,
        customerModalOpen,
      }}
    >
      <CreateCustomerModal />
      {children}
    </CustomerModalContext.Provider>
  );
};
