import { IProductsDeleteResponse } from '@/app/api/(dashboard)/products/[slug]/route';
import LoadingButton from '@/components/shared/LoadingButton';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { CustomerModalContext } from '@/providers/CustomerModalProvider';
import { useTranslations } from 'next-intl';
import { usePathname, useRouter } from 'next/navigation';
import { useContext, useState } from 'react';
import { toast } from 'sonner';

export function DeleteCustomerConfirmModal() {
  const t = useTranslations();
  const ctx = useContext(CustomerModalContext);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const customer = ctx.customerToDelete;

  if (!customer) return null;

  const handleDeleteCustomer = async (customerId: string) => {
    const response = await fetch(`/api/customers/${customerId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json()) as IProductsDeleteResponse;

    return data;
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      const res = await handleDeleteCustomer(customer.id);

      if ('message' in res) {
        toast.error(res.message);
      } else {
        toast.success(t('dashboard.customers.customer_deleted'));

        if (pathname.includes('/dashboard/customers/')) {
          router.push('/dashboard/customers');
        }
      }

      router.refresh();
      ctx.setCustomerToDelete(null);
      handleOpenChange(false);
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    ctx.setCustomerToDeleteModalOpen(open);
  };

  return (
    <>
      <ResponsiveDialog
        open={ctx.customerToDeleteModalOpen}
        onOpenChange={handleOpenChange}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t('dashboard.customers.delete_customer_confirm_title')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t.rich(
                'dashboard.customers.delete_customer_confirm_description',
                {
                  name: customer.fullName ?? customer.email,
                  strong: (child) => <strong>{child}</strong>,
                },
              )}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <ResponsiveDialogFooter>
            <LoadingButton
              size="sm"
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
                ctx.setCustomerToDelete(null);
              }}
            >
              {t('general.cancel')}
            </LoadingButton>
            <LoadingButton
              pending={loading}
              size="sm"
              variant="destructive"
              onClick={onSubmit}
            >
              {t('dashboard.customers.delete_customer')}
            </LoadingButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
