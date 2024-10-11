'use client';
import { ICustomersGetSuccessResponse } from '@/app/api/(dashboard)/customers/route';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CustomerModalContext } from '@/providers/CustomerModalProvider';
import { VariantProps } from 'class-variance-authority';
import { Edit, Ellipsis, Trash } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext } from 'react';

interface CustomersActionDropdownProps {
  customer: ICustomersGetSuccessResponse['customers'][number] | undefined;
  variant?: VariantProps<typeof buttonVariants>['variant'];
}

export const CustomersActionDropdown = ({
  customer,
  variant = 'ghost',
}: CustomersActionDropdownProps) => {
  const ctx = useContext(CustomerModalContext);
  const t = useTranslations();

  if (!customer) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button size="icon" variant={variant}>
          <Ellipsis className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="font-medium" forceMount>
        <DropdownMenuItem
          className="hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            ctx.setCustomerToEdit(customer);
            ctx.setCustomerModalOpen(true);
          }}
        >
          <Edit className="mr-2 h-4 w-4" />
          {t('dashboard.customers.edit_customer')}
        </DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive hover:cursor-pointer"
          onClick={(e) => {
            e.stopPropagation();
            ctx.setCustomerToDelete(customer);
            ctx.setCustomerToDeleteModalOpen(true);
          }}
        >
          <Trash className="mr-2 h-4 w-4" />
          {t('dashboard.customers.delete_customer')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
