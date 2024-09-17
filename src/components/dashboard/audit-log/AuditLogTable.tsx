'use client';
import {
  IAuditLogsGetResponse,
  IAuditLogsGetSuccessResponse,
} from '@/app/api/(dashboard)/audit-log/route';
import { DateConverter } from '@/components/shared/DateConverter';
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
import { ArrowDownUp, ChevronDown, ChevronRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function AuditLogTable() {
  const t = useTranslations();

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [totalAuditLogs, setTotalAuditLogs] = useState(1);
  const [sortColumn, setSortColumn] = useState<'createdAt' | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(
    null,
  );
  const [pageSize, setPageSize] = useState(25);
  const [loading, setLoading] = useState(true);
  const [auditLogs, setAuditLogs] = useState<
    IAuditLogsGetSuccessResponse['auditLogs']
  >([]);
  const [page, setPage] = useState(1);

  useEffect(() => {
    (async () => {
      try {
        const searchParams = new URLSearchParams();
        if (sortColumn) {
          searchParams.set('sortColumn', sortColumn);
        }

        if (sortDirection) {
          searchParams.set('sortDirection', sortDirection);
        }

        const response = await fetch(`/api/audit-log?${searchParams}`);
        const data = (await response.json()) as IAuditLogsGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setAuditLogs(data.auditLogs);
        setTotalAuditLogs(data.totalAuditLogs);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [sortColumn, sortDirection, page, t]);

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-xl font-bold">
          {t('dashboard.navigation.audit_logs')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <style jsx>{`
          .expanded-content {
            max-height: 0;
            overflow: hidden;
            transition:
              max-height 0.3s ease-out,
              opacity 0.3s ease-out;
            opacity: 0;
          }
          .expanded-content.open {
            max-height: 850px;
            opacity: 1;
            transition:
              max-height 0.5s ease-in,
              opacity 0.3s ease-in;
          }
        `}</style>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="truncate" />
              <TableHead className="truncate">{t('general.action')}</TableHead>
              <TableHead className="truncate">{t('general.target')}</TableHead>
              <TableHead className="truncate">{t('general.device')}</TableHead>
              <TableHead className="truncate">
                {t('general.ip_address')}
              </TableHead>
              <TableHead className="truncate">
                <Button
                  variant="ghost"
                  onClick={() => {
                    setSortColumn('createdAt');
                    setSortDirection(
                      sortColumn === 'createdAt' && sortDirection === 'asc'
                        ? 'desc'
                        : 'asc',
                    );
                  }}
                >
                  {t('general.created_at')}
                  <ArrowDownUp className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableSkeleton columns={6} rows={7} />
          ) : (
            <TableBody>
              {auditLogs.map((auditLog) => (
                <React.Fragment key={auditLog.id}>
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => toggleRow(auditLog.id)}
                  >
                    <TableCell className="truncate py-0 pr-0">
                      <Button size="sm" variant="ghost">
                        {expandedRows.has(auditLog.id) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </Button>
                    </TableCell>
                    <TableCell className="truncate">
                      <b>{auditLog.user?.email}</b> {auditLog.action}
                    </TableCell>
                    <TableCell className="truncate">
                      <Badge className="text-xs" variant="secondary">
                        {auditLog.targetType}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate">
                      {auditLog.device}
                    </TableCell>
                    <TableCell className="truncate">
                      {auditLog.ipAddress}
                    </TableCell>
                    <TableCell className="truncate">
                      <DateConverter date={auditLog.createdAt} />
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="p-0" colSpan={6}>
                      <div
                        className={`expanded-content ${expandedRows.has(auditLog.id) ? 'open' : ''}`}
                      >
                        <div className="m-2 rounded-md p-4">
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                            <div className="flex flex-col gap-3">
                              <div className="flex gap-2">
                                <h3 className="flex-[0 0 20%] min-w-[180px] max-w-[240px] text-sm font-semibold">
                                  {t('general.user')}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {auditLog.user?.email}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <h3 className="flex-[0 0 20%] min-w-[180px] max-w-[240px] text-sm font-semibold">
                                  {t('general.ip_address')}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {auditLog.alpha2 && (
                                    <Image
                                      alt={
                                        auditLog.alpha3 ?? t('general.unknown')
                                      }
                                      className="rounded-[2px]"
                                      height={20}
                                      src={`/countries/${auditLog.alpha2.toLowerCase()}.svg`}
                                      width={20}
                                    />
                                  )}
                                  {auditLog.ipAddress ?? t('general.unknown')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <h3 className="flex-[0 0 20%] min-w-[180px] max-w-[240px] text-sm font-semibold">
                                  {t('general.browser')}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {auditLog.browser ?? t('general.unknown')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <h3 className="flex-[0 0 20%] min-w-[180px] max-w-[240px] text-sm font-semibold">
                                  {t('general.operating_system')}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {auditLog.os ?? t('general.unknown')}
                                </p>
                              </div>
                              <div className="flex gap-2">
                                <h3 className="flex-[0 0 20%] min-w-[180px] max-w-[240px] text-sm font-semibold">
                                  {t('general.device')}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {auditLog.device ?? t('general.unknown')}
                                </p>
                              </div>
                              {['CUSTOMER', 'LICENSE', 'PRODUCT'].includes(
                                auditLog.targetType,
                              ) && (
                                <div className="flex gap-2">
                                  <h3 className="flex-[0 0 20%] min-w-[180px] max-w-[240px] text-sm font-semibold">
                                    {t(
                                      `general.${auditLog.targetType.toLowerCase()}` as any,
                                    )}
                                  </h3>
                                  <Link
                                    className="truncate text-sm font-semibold text-primary hover:underline"
                                    href={`/dashboard/${auditLog.targetType.toLowerCase()}s/${auditLog.targetId}`}
                                    title={auditLog.targetId}
                                  >
                                    {auditLog.targetId}
                                  </Link>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              ))}
            </TableBody>
          )}
        </Table>
        <TablePagination
          page={page}
          pageSize={pageSize}
          results={auditLogs.length}
          setPage={setPage}
          setPageSize={setPageSize}
          totalItems={totalAuditLogs}
          totalPages={Math.ceil(totalAuditLogs / pageSize)}
        />
      </CardContent>
    </Card>
  );
}
