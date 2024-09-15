'use client';
import { ICustomerGetSuccessResponse } from '@/app/api/(dashboard)/customers/[slug]/route';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CustomerModalContext } from '@/providers/CustomerModalProvider';
import { Edit, Ellipsis, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface CustomerActionsProps {
  customer: ICustomerGetSuccessResponse['customer'] | null;
}
export default function CustomerActions({ customer }: CustomerActionsProps) {
  const t = useTranslations();
  const ctx = useContext(CustomerModalContext);

  const handleCustomerEdit = () => {
    ctx.setCustomerToEdit(customer);
    ctx.setCustomerModalOpen(true);
  };

  const handleCustomerDelete = () => {
    ctx.setCustomerToDelete(customer);
    ctx.setCustomerToDeleteModalOpen(true);
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
          onClick={handleCustomerEdit}
        >
          <Edit className="mr-2 h-4 w-4" />
          {t('dashboard.customers.edit_customer')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive hover:cursor-pointer"
          onClick={handleCustomerDelete}
        >
          <Trash className="mr-2 h-4 w-4" />
          {t('dashboard.customers.delete_customer')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
