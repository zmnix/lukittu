'use client';
import SetLicenseModal from '@/components/dashboard/licenses/list/SetLicenseModal';
import { Customer, License, Product } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';
import { createContext, useState } from 'react';

type LicenseToEdit = Omit<License, 'licenseKeyLookup' | 'metadata'> & {
  products: Product[];
  customers: Customer[];
  metadata: JsonValue;
};

export const LicenseModalContext = createContext({
  setLicenseModalOpen: (open: boolean) => {},
  setLicenseToEdit: (license: LicenseToEdit | null) => {},
  licenseToEdit: null as LicenseToEdit | null,
  licenseModalOpen: false,
});

export const LicenseModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);
  const [licenseToEdit, setLicenseToEdit] = useState<LicenseToEdit | null>(
    null,
  );

  return (
    <LicenseModalContext.Provider
      value={{
        setLicenseToEdit,
        setLicenseModalOpen,
        licenseToEdit,
        licenseModalOpen,
      }}
    >
      <SetLicenseModal />
      {children}
    </LicenseModalContext.Provider>
  );
};
