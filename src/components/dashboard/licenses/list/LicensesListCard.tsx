import { LicenseModalProvider } from '@/providers/LicenseModalProvider';
import { LicensesListTable } from './LicensesListTable';

export default async function LicensesListCard() {
  return (
    <LicenseModalProvider>
      <LicensesListTable />
    </LicenseModalProvider>
  );
}
