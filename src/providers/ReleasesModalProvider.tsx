'use client';
import SetReleaseModal from '@/components/dashboard/releases/list/SetReleaseModal';
import { Release } from '@prisma/client';
import { createContext, useState } from 'react';

export const ReleaseModalContext = createContext({
  setReleaseToDelete: (release: Release | null) => {},
  setReleaseToEdit: (release: Release | null) => {},
  setReleaseModalOpen: (open: boolean) => {},
  setReleaseToDeleteModalOpen: (open: boolean) => {},
  releaseToEdit: null as Release | null,
  releaseToDelete: null as Release | null,
  releaseToDeleteModalOpen: false,
  releaseModalOpen: false,
});

export const ReleaseModalProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [releaseToDelete, setReleaseToDelete] = useState<Release | null>(null);
  const [releaseToDeleteModalOpen, setReleaseToDeleteModalOpen] =
    useState(false);
  const [releaseToEdit, setReleaseToEdit] = useState<Release | null>(null);
  const [releaseModalOpen, setReleaseModalOpen] = useState(false);

  return (
    <ReleaseModalContext.Provider
      value={{
        setReleaseToDelete,
        setReleaseModalOpen,
        setReleaseToDeleteModalOpen,
        setReleaseToEdit,
        releaseToEdit,
        releaseToDelete,
        releaseToDeleteModalOpen,
        releaseModalOpen,
      }}
    >
      <SetReleaseModal />
      {children}
    </ReleaseModalContext.Provider>
  );
};
