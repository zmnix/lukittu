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
  footerElement?: React.ReactNode | null;
  contentElement?: React.ReactNode | null;
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

  const [footerElement, setFooterElement] = useState<React.ReactNode>(
    <LoadingButton
      size="sm"
      variant="outline"
      onClick={() => handleOpenChange(false)}
    >
      {t('general.cancel')}
    </LoadingButton>,
  );

  const [contentElement, setContentElement] = useState<React.ReactNode | null>(
    null,
  );

  const openConfirmModal = ({
    title,
    description,
    footerElement,
    contentElement,
  }: ModalProps) => {
    setTitle(title);
    setDescription(description);

    if (footerElement) {
      setFooterElement(footerElement);
    }

    if (contentElement) {
      setContentElement(contentElement);
    }

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
        {contentElement && contentElement}
        <ResponsiveDialogFooter>{footerElement}</ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );

  return { openConfirmModal, ConfirmModal };
};
