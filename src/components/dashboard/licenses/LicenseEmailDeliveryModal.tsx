import { ILicenseEmailDeliveryResponse } from '@/app/api/(dashboard)/licenses/[slug]/email-delivery/route';
import LoadingButton from '@/components/shared/LoadingButton';
import { Card, CardContent } from '@/components/ui/card';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { LicenseModalContext } from '@/providers/LicenseModalProvider';
import { Check, TriangleAlert } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext, useState } from 'react';
import { toast } from 'sonner';

export function LicenseEmailDeliveryModal() {
  const t = useTranslations();
  const ctx = useContext(LicenseModalContext);
  const [loading, setLoading] = useState(false);

  const license = ctx.licenseEmailDelivery;

  if (!license) return null;

  const handleLicenseDelivery = async (licenseId: string) => {
    const response = await fetch(`/api/licenses/${licenseId}/email-delivery`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = (await response.json()) as ILicenseEmailDeliveryResponse;

    return data;
  };

  const onSubmit = async () => {
    setLoading(true);
    try {
      const res = await handleLicenseDelivery(license.id);

      if ('message' in res) {
        toast.error(res.message);
      } else {
        toast.success(t('dashboard.licenses.emails_delivered'));
      }

      ctx.setLicenseEmailDelivery(null);
      handleOpenChange(false);
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenChange = (open: boolean) => {
    ctx.setLicenseEmailDeliveryModalOpen(open);
  };

  return (
    <>
      <ResponsiveDialog
        open={ctx.licenseEmailDeliveryModalOpen}
        onOpenChange={handleOpenChange}
      >
        <ResponsiveDialogContent>
          <ResponsiveDialogHeader>
            <ResponsiveDialogTitle>
              {t('dashboard.licenses.email_delivery_confirm_title')}
            </ResponsiveDialogTitle>
            <ResponsiveDialogDescription>
              {t('dashboard.licenses.email_delivery_confirm_description')}
            </ResponsiveDialogDescription>
          </ResponsiveDialogHeader>
          <div className="space-y-2 max-md:px-2">
            <h2 className="text-sm font-semibold">
              {t('dashboard.navigation.customers')}
            </h2>
            {license.customers.map((customer) => (
              <Card key={customer.id}>
                <CardContent className="flex items-center px-4 py-2">
                  <div>
                    {customer.email ? (
                      <Check className="mr-4 h-6 w-6 text-green-500" />
                    ) : (
                      <TriangleAlert className="mr-4 h-6 w-6 text-yellow-500" />
                    )}
                  </div>
                  <div className="grid">
                    <h2 className="truncate font-semibold">
                      {customer.fullName ?? t('general.unknown')}
                    </h2>
                    <p className="truncate text-sm text-muted-foreground">
                      {customer.email ?? t('general.unknown')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <ResponsiveDialogFooter>
            <LoadingButton
              size="sm"
              variant="outline"
              onClick={() => {
                handleOpenChange(false);
                ctx.setLicenseEmailDelivery(null);
              }}
            >
              {t('general.cancel')}
            </LoadingButton>
            <LoadingButton pending={loading} size="sm" onClick={onSubmit}>
              {t('dashboard.licenses.send_email_delivery')}
            </LoadingButton>
          </ResponsiveDialogFooter>
        </ResponsiveDialogContent>
      </ResponsiveDialog>
    </>
  );
}
