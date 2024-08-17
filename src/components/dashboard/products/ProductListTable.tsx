import TablePagination from '@/components/shared/table/TablePagination';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import prisma from '@/lib/database/prisma';
import { getSession } from '@/lib/utils/auth';
import { getLanguage, getSelectedTeam } from '@/lib/utils/header-helpers';
import { Package } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { redirect } from 'next/navigation';
import AddProductButton from './AddProductButton';
import ProductListTableActions from './ProductListTableActions';
import ProductListTableHeader from './ProductListTableHeader';

interface ProductListTableProps {
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function ProductListTable({
  searchParams,
}: ProductListTableProps) {
  const locale = getLanguage();
  const t = await getTranslations({ locale });
  const session = await getSession({ user: true });
  const selectedTeam = getSelectedTeam();

  if (!selectedTeam) return null;

  const allowedPageSizes = [25, 50, 100];
  const allowedSortDirections = ['asc', 'desc'];
  const allowedSortColumns = ['name', 'createdAt'];

  let page = parseInt(searchParams.page as string) || 1;
  let pageSize = parseInt(searchParams.pageSize as string) || 10;
  let sortColumn = searchParams.sortColumn as string;
  let sortDirection = searchParams.sortDirection as 'asc' | 'desc';
  let search = (searchParams.search as string) || '';

  if (!allowedSortDirections.includes(sortDirection)) {
    sortDirection = 'desc';
  }

  if (!sortColumn || !allowedSortColumns.includes(sortColumn)) {
    sortColumn = 'createdAt';
  }

  if (!allowedPageSizes.includes(pageSize)) {
    pageSize = 25;
  }

  if (page < 1) {
    page = 1;
  }

  const skip = (page - 1) * pageSize;
  const take = pageSize;

  const team = await prisma.team.findUnique({
    where: {
      id: selectedTeam,
      deletedAt: null,
      users: {
        some: {
          id: session.user.id,
        },
      },
    },
    include: {
      products: {
        where: {
          deletedAt: null,
          teamId: selectedTeam,
          name: search
            ? {
                contains: search,
                mode: 'insensitive',
              }
            : undefined,
        },
        skip,
        take,
        orderBy: {
          [sortColumn]: sortDirection,
        },
      },
      _count: {
        select: {
          products: {
            where: {
              deletedAt: null,
              teamId: selectedTeam,
              name: search
                ? { contains: search, mode: 'insensitive' }
                : undefined,
            },
          },
        },
      },
    },
  });

  if (!team) {
    redirect('/dashboard');
  }

  const hasProducts = await prisma.product.findFirst({
    where: {
      teamId: selectedTeam,
      deletedAt: null,
    },
  });

  return hasProducts && team ? (
    <>
      <Table>
        <ProductListTableHeader />
        <TableBody>
          {team.products.map((product) => (
            <TableRow key={product.id}>
              <TableCell className="truncate">{product.name}</TableCell>
              <TableCell
                className="truncate"
                title={new Date(product.createdAt).toLocaleString(locale)}
              >
                {new Date(product.createdAt).toLocaleString(locale, {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </TableCell>
              <TableCell className="truncate py-0 text-right">
                <ProductListTableActions product={product} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <TablePagination
        totalPages={Math.ceil(team.products.length / pageSize)}
      />
    </>
  ) : (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="flex w-full max-w-xl flex-col items-center justify-center gap-4">
        <div className="flex">
          <span className="rounded-lg bg-secondary p-4">
            <Package className="h-6 w-6" />
          </span>
        </div>
        <h3 className="text-lg font-bold">
          {t('dashboard.products.add_your_first_product')}
        </h3>
        <p className="max-w-sm text-center text-sm text-muted-foreground">
          {t('dashboard.products.product_description')}
        </p>
        <div>
          <AddProductButton />
        </div>
      </div>
    </div>
  );
}
