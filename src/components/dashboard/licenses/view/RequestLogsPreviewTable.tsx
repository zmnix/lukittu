import { ILicenseGetSuccessResponse } from '@/app/api/(dashboard)/licenses/[slug]/route';
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
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';

interface RequestLogsPreviewTableProps {
  license: ILicenseGetSuccessResponse['license'];
}

export default function RequestLogsPreviewTable({
  license,
}: RequestLogsPreviewTableProps) {
  const t = useTranslations();
  const router = useRouter();
  const locale = useLocale();

  const hasMoreLogs = license.requestLogs.length === 7;
  const logsToShow = hasMoreLogs
    ? license.requestLogs.slice(0, 6)
    : license.requestLogs;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {t('dashboard.logs.logs')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {license.requestLogs.length ? (
          <>
            <Table>
              <TableHeader>
                <TableHead className="truncate">
                  {t('general.ip_address')}
                </TableHead>
                <TableHead className="truncate">
                  {t('dashboard.licenses.status')}
                </TableHead>
                <TableHead className="truncate">
                  {t('general.created_at')}
                </TableHead>
              </TableHeader>
              <TableBody>
                {logsToShow.map((log) => (
                  <TableRow
                    key={log.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/dashboard/logs/${log.id}`)}
                  >
                    <TableCell className="truncate">{log.ipAddress}</TableCell>
                    <TableCell className="truncate">
                      <Badge className="text-xs" variant="secondary">
                        {log.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="truncate">
                      {new Date(log.createdAt).toLocaleString(locale, {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: 'numeric',
                        minute: 'numeric',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Button
              className="mt-4"
              disabled={!hasMoreLogs}
              size="sm"
              variant="link"
            >
              {t('general.show_more')}
            </Button>
          </>
        ) : (
          <div className="flex h-24 flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm text-muted-foreground">
            {t('dashboard.logs.no_logs')}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
