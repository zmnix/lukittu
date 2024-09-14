import { CustomerModalProvider } from '@/providers/CustomerModalProvider';
import { CustomersListTable } from './CustomersListTable';

export default async function CustomersListCard() {
  return (
    <CustomerModalProvider>
      <CustomersListTable />
    </CustomerModalProvider>
  );
}
