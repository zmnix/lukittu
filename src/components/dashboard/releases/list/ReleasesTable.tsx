'use client';
import {
  IProductsReleasesGetResponse,
  IProductsReleasesGetSuccessResponse,
} from '@/app/api/(dashboard)/products/releases/route';
import { DateConverter } from '@/components/shared/DateConverter';
import AddEntityButton from '@/components/shared/misc/AddEntityButton';
import TablePagination from '@/components/shared/table/TablePagination';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTableScroll } from '@/hooks/useTableScroll';
import { bytesToSize } from '@/lib/utils/number-helpers';
import { cn } from '@/lib/utils/tailwind-helpers';
import { ReleaseModalProvider } from '@/providers/ReleasesModalProvider';
import { TeamContext } from '@/providers/TeamProvider';
import { ArrowDownUp, CloudOff, CloudUpload } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ReleasesActionDropdown } from '../ReleasesActionDropdown';

interface ReleasesTableProps {
  productId: string;
}

export function ReleasesTable({ productId }: ReleasesTableProps) {
  const locale = useLocale();
  const t = useTranslations();
  const { showDropdown, containerRef } = useTableScroll();
  const teamCtx = useContext(TeamContext);
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [releases, setReleases] = useState<
    IProductsReleasesGetSuccessResponse['releases']
  >([]);
  const [sortColumn, setSortColumn] = useState<'createdAt' | 'version'>(
    'createdAt',
  );
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [totalReleases, setTotalReleases] = useState(1);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      if (!teamCtx.selectedTeam) return;

      setLoading(true);

      try {
        const searchParams = new URLSearchParams({
          page: page.toString(),
          pageSize: '10',
          sortColumn,
          sortDirection,
          productId,
        });

        const response = await fetch(
          `/api/products/releases?${searchParams.toString()}`,
        );

        const data = (await response.json()) as IProductsReleasesGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setReleases(data.releases);
        setTotalReleases(data.totalResults);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, t, sortColumn, sortDirection, teamCtx.selectedTeam, productId]);

  return (
    <ReleaseModalProvider>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.releases')}
            <div className="ml-auto flex gap-2">
              <AddEntityButton entityType="release" variant="outline" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {totalReleases && teamCtx.selectedTeam ? (
            <>
              <Table
                className="relative"
                containerRef={containerRef as React.RefObject<HTMLDivElement>}
              >
                <TableHeader>
                  <TableRow>
                    <TableHead className="truncate">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSortColumn('version');
                          setSortDirection(
                            sortColumn === 'version' && sortDirection === 'asc'
                              ? 'desc'
                              : 'asc',
                          );
                        }}
                      >
                        {t('general.version')}
                        <ArrowDownUp className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead className="truncate">
                      {t('general.status')}
                    </TableHead>
                    <TableHead className="truncate">
                      {t('general.file')}
                    </TableHead>
                    <TableHead className="truncate">
                      <Button
                        variant="ghost"
                        onClick={() => {
                          setSortColumn('createdAt');
                          setSortDirection(
                            sortColumn === 'createdAt' &&
                              sortDirection === 'asc'
                              ? 'desc'
                              : 'asc',
                          );
                        }}
                      >
                        {t('general.created_at')}
                        <ArrowDownUp className="ml-2 h-4 w-4" />
                      </Button>
                    </TableHead>
                    <TableHead
                      className={cn(
                        'sticky right-0 w-[50px] truncate px-2 text-right',
                        {
                          'bg-background drop-shadow-md': showDropdown,
                        },
                      )}
                    />
                  </TableRow>
                </TableHeader>
                {loading ? (
                  <TableSkeleton columns={5} rows={6} />
                ) : (
                  <TableBody>
                    {releases.map((release) => (
                      <TableRow
                        key={release.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/dashboard/releases/${release.id}`)
                        }
                      >
                        <TableCell className="truncate">
                          <div className="flex items-center gap-2">
                            {release.version}{' '}
                            {release.latest && (
                              <Badge className="text-xs">
                                {t('general.latest')}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="truncate">
                          <Badge className="text-xs">{release.status}</Badge>
                        </TableCell>
                        <TableCell className="truncate">
                          {release.file ? (
                            <div className="flex items-center gap-2">
                              <CloudUpload size={18} />{' '}
                              {bytesToSize(release.file.size)}
                            </div>
                          ) : (
                            <span className="flex items-center gap-2">
                              <CloudOff size={18} />
                            </span>
                          )}
                        </TableCell>
                        <TableCell
                          className="truncate"
                          title={new Date(release.createdAt).toLocaleString(
                            locale,
                          )}
                        >
                          <DateConverter date={release.createdAt} />
                        </TableCell>
                        <TableCell
                          className={cn(
                            'sticky right-0 w-[50px] truncate px-2 py-0 text-right',
                            {
                              'bg-background drop-shadow-md': showDropdown,
                            },
                          )}
                        >
                          <ReleasesActionDropdown release={release} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                )}
              </Table>
              <TablePagination
                page={page}
                pageSize={10}
                results={releases.length}
                setPage={setPage}
                totalItems={totalReleases}
                totalPages={Math.ceil(totalReleases / 10)}
              />
            </>
          ) : (
            <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
              {t('dashboard.releases.no_releases_assigned')}
            </div>
          )}
        </CardContent>
      </Card>
    </ReleaseModalProvider>
  );
}
