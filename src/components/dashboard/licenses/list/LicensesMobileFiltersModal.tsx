import { CustomersMultiselect } from '@/components/shared/form/CustomersMultiselect';
import { ProductsMultiselect } from '@/components/shared/form/ProductsMultiselect';
import LoadingButton from '@/components/shared/LoadingButton';
import { Input } from '@/components/ui/input';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import { Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';

interface LicensesMobileFiltersModalProps {
  productIds: string[];
  customerIds: string[];
  search: string;
  setProductIds: React.Dispatch<React.SetStateAction<string[]>>;
  setCustomerIds: React.Dispatch<React.SetStateAction<string[]>>;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  open: boolean;
  onOpenChange: (boolean: boolean) => void;
}

export default function LicensesMobileFiltersModal({
  customerIds,
  productIds,
  open,
  search,
  setSearch,
  setCustomerIds,
  setProductIds,
  onOpenChange,
}: LicensesMobileFiltersModalProps) {
  const t = useTranslations();

  const [tempSearch, setTempSearch] = useState(search);
  const [tempProductIds, setTempProductIds] = useState<string[]>(productIds);
  const [tempCustomerIds, setTempCustomerIds] = useState<string[]>(customerIds);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
  };

  const handleApply = () => {
    setSearch(tempSearch);
    setProductIds(tempProductIds);
    setCustomerIds(tempCustomerIds);
    handleOpenChange(false);
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[625px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t('general.filters')}</ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <form
          className="flex flex-col gap-4 max-md:px-2"
          onSubmit={(e) => {
            e.preventDefault();
            handleApply();
          }}
        >
          <div className="relative flex w-full items-center max-lg:w-full">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
            <Input
              className="pl-8"
              placeholder={t('dashboard.licenses.search_license')}
              value={tempSearch}
              onChange={(e) => {
                setTempSearch(e.target.value);
              }}
            />
          </div>
          <ProductsMultiselect
            initialProductIds={tempProductIds}
            setProductIds={setTempProductIds}
          />
          <CustomersMultiselect
            initialCustomerIds={tempCustomerIds}
            setCustomerIds={setTempCustomerIds}
          />
        </form>
        <ResponsiveDialogFooter>
          <div>
            <LoadingButton className="w-full" variant="outline">
              {t('general.close')}
            </LoadingButton>
          </div>
          <div>
            <LoadingButton className="w-full" onClick={handleApply}>
              {t('general.apply')}
            </LoadingButton>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
