import { Skeleton } from '@/components/ui/skeleton';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';

export default function ProductListTableSkeleton() {
  return (
    <TableBody>
      {[...Array(6)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton className="h-5 w-24" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-5 w-24" />
          </TableCell>
          <TableCell className="flex items-center justify-end">
            <Skeleton className="h-5 w-8" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );
}
