'use client';
import { ILicenseGetSuccessResponse } from '@/app/api/(dashboard)/licenses/[slug]/route';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LicenseModalContext } from '@/providers/LicenseModalProvider';
import { Copy, Edit, Ellipsis, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';
import { toast } from 'sonner';

interface LicenseActionsProps {
  license: ILicenseGetSuccessResponse['license'] | null;
}
export default function LicenseActions({ license }: LicenseActionsProps) {
  const t = useTranslations();
  const ctx = useContext(LicenseModalContext);

  const handleLicenseEdit = () => {
    ctx.setLicenseToEdit(license);
    ctx.setLicenseModalOpen(true);
  };

  const handleLicenseDelete = () => {
    ctx.setLicenseToDelete(license);
    ctx.setLicenseToDeleteModalOpen(true);
  };

  const handleCopy = (licenseKey: string) => {
    navigator.clipboard.writeText(licenseKey);
    toast.success(t('general.copied_to_clipboard'));
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant="outline">
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-medium" forceMount>
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={() => handleCopy(license?.licenseKey ?? '')}
        >
          <Copy className="mr-2 h-4 w-4" />
          {t('general.click_to_copy')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={handleLicenseEdit}
        >
          <Edit className="mr-2 h-4 w-4" />
          {t('dashboard.licenses.edit_license')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive hover:cursor-pointer"
          onClick={handleLicenseDelete}
        >
          <Trash className="mr-2 h-4 w-4" />
          {t('dashboard.licenses.delete_license')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
