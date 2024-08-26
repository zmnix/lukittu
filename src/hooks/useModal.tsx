import LoadingButton from '@/components/shared/LoadingButton';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { useTranslations } from 'next-intl';
import React, { useState } from 'react';

interface ModalProps {
  title: string;
  description: string | React.ReactNode;
}

export const useModal = () => {
  const t = useTranslations();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState<React.ReactNode | string>('');

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setTitle('');
      setDescription('');
    }
  };

  const openConfirmModal = ({ title, description }: ModalProps) => {
    setTitle(title);
    setDescription(description);
    setOpen(true);
  };

  const ConfirmModal = () => (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{title}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {description}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <ResponsiveDialogFooter>
          <LoadingButton
            size="sm"
            variant="outline"
            onClick={() => handleOpenChange(false)}
          >
            {t('general.cancel')}
          </LoadingButton>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );

  return { openConfirmModal, ConfirmModal };
};
