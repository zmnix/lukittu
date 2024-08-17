import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function ProductListTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="truncate">
            <Skeleton className="h-5 w-24" />
          </TableHead>
          <TableHead className="truncate">
            <Skeleton className="h-5 w-24" />
          </TableHead>
          <TableHead className="flex items-center justify-end truncate">
            <Skeleton className="h-5 w-24" />
          </TableHead>
        </TableRow>
      </TableHeader>
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
    </Table>
  );
}
