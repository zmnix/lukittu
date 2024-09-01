'use client';
import CreateLicenseModal from '@/components/dashboard/licenses/list/CreateLicenseModal';
import { createContext, useState } from 'react';

export const LicenseModalContext = createContext({
  setLicenseModalOpen: (open: boolean) => {},
  licenseModalOpen: false,
});

export const LicenseModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [licenseModalOpen, setLicenseModalOpen] = useState(false);

  return (
    <LicenseModalContext.Provider
      value={{
        setLicenseModalOpen,
        licenseModalOpen,
      }}
    >
      <CreateLicenseModal />
      {children}
    </LicenseModalContext.Provider>
  );
};
