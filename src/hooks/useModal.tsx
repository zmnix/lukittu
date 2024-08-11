import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { buttonVariants } from '@/components/ui/button';
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

  const handleClose = () => {
    setOpen(false);
    setTitle('');
    setDescription('');
  };

  const [footerElement, setFooterElement] = useState<React.ReactNode>(
    <AlertDialogCancel
      className={buttonVariants({ variant: 'outline', size: 'sm' })}
      onClick={handleClose}
    >
      {t('general.cancel')}
    </AlertDialogCancel>,
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
    <AlertDialog open={open} onOpenChange={handleClose}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        {contentElement && contentElement}
        <AlertDialogFooter>{footerElement}</AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return { openConfirmModal, ConfirmModal };
};
