import { ProductModalProvider } from '@/providers/ProductModalProvider';
import { ProductListTable } from './ProductsListTable';

export default async function ProductsListCard() {
  return (
    <ProductModalProvider>
      <ProductListTable />
    </ProductModalProvider>
  );
}
