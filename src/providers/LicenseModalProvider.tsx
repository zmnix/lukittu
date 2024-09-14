'use client';
import { DeleteLicenseConfirmModal } from '@/components/dashboard/licenses/LicenseDeleteConfirmModal';
import SetLicenseModal from '@/components/dashboard/licenses/list/SetLicenseModal';
import { Customer, License, Product } from '@prisma/client';
import { createContext, useState } from 'react';

type LicenseToEdit = Omit<License, 'licenseKeyLookup'> & {
  products: Product[];
  customers: Customer[];
};

export const LicenseModalContext = createContext({
  setLicenseModalOpen: (open: boolean) => {},
  setLicenseToEdit: (license: LicenseToEdit | null) => {},
  setLicenseToDelete: (license: Omit<License, 'licenseKeyLookup'> | null) => {},
  setLicenseToDeleteModalOpen: (open: boolean) => {},
  licenseToEdit: null as LicenseToEdit | null,
  licenseModalOpen: false,
  licenseToDelete: null as Omit<License, 'licenseKeyLookup'> | null,
  licenseToDeleteModalOpen: false,
});

export const LicenseModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [licenseToDelete, setLicenseToDelete] = useState<Omit<
    License,
    'licenseKeyLookup'
  > | null>(null);
  const [licenseToDeleteModalOpen, setLicenseToDeleteModalOpen] =
    useState(false);
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseToEdit, setLicenseToEdit] = useState<LicenseToEdit | null>(
    null,
  );

  return (
    <LicenseModalContext.Provider
      value={{
        setLicenseToEdit,
        setLicenseModalOpen,
        setLicenseToDelete,
        setLicenseToDeleteModalOpen,
        licenseToEdit,
        licenseModalOpen,
        licenseToDelete,
        licenseToDeleteModalOpen,
      }}
    >
      <DeleteLicenseConfirmModal />
      <SetLicenseModal />
      {children}
    </LicenseModalContext.Provider>
  );
};
