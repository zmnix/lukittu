'use client';
import { ISessionsSignOutResponse } from '@/app/api/(dashboard)/sessions/[slug]/route';
import {
  ISessionsGetResponse,
  ISessionsGetSuccessResponse,
  ISessionsSignOutAllResponse,
} from '@/app/api/(dashboard)/sessions/route';
import { DateConverter } from '@/components/shared/DateConverter';
import LoadingButton from '@/components/shared/LoadingButton';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { LogOut } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export default function SessionsTable() {
  const t = useTranslations();

  const [pendingSingleId, setPendingSingleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [sessions, setSessions] = useState<
    ISessionsGetSuccessResponse['sessions']
  >([]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/sessions');
        const data = (await res.json()) as ISessionsGetResponse;

        if ('message' in data) {
          toast.error(data.message);
          return;
        }

        if (res.ok) {
          setSessions(data.sessions);
        }
      } catch (error: any) {
        toast.error(error.message ?? t('general.error_occurred'));
      } finally {
        setLoading(false);
      }
    })();
  }, [t]);

  const hasOtherThanCurrentSession = sessions.some(
    (session) => !session.current,
  );

  const handleSignOutSingleSession = async (id: string) => {
    const response = await fetch(`/api/sessions/${id}`, {
      method: 'DELETE',
    });

    const data = (await response.json()) as ISessionsSignOutResponse;

    return data;
  };

  const handleSignOutAllSessions = async () => {
    const response = await fetch('/api/sessions', {
      method: 'DELETE',
    });

    const data = (await response.json()) as ISessionsSignOutAllResponse;

    return data;
  };

  const onSessionLogoutSubmit = async (id: string) => {
    setPendingSingleId(id);
    try {
      const res = await handleSignOutSingleSession(id);

      if ('message' in res) {
        toast.error(res.message);
        return;
      }

      setSessions((prev) => prev.filter((session) => session.id !== id));
      toast.success(t('dashboard.profile.logged_out_session'));
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setPendingSingleId(null);
    }
  };

  const onSessionLogoutAllSubmit = async () => {
    setSubmitting(true);
    try {
      const res = await handleSignOutAllSessions();
      if ('message' in res) {
        toast.error(res.message);
        return;
      }

      setSessions((prev) => prev.filter((session) => session.current));
      toast.success(t('dashboard.profile.logged_out_all_sessions'));
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xl font-bold">
          {t('dashboard.profile.login_sessions')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="truncate">{t('general.device')}</TableHead>
              <TableHead className="truncate">
                {t('general.ip_address')}
              </TableHead>
              <TableHead className="truncate">{t('general.date')}</TableHead>
              <TableHead className="text-right">
                {t('general.actions')}
              </TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableSkeleton columns={4} rows={4} />
          ) : (
            <TableBody>
              {sessions.map((session) => (
                <TableRow key={session.id}>
                  <TableCell className="truncate">
                    {`${session.browser ?? 'N/A'} - ${session.os ?? ''}`.trim()}
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    {session.alpha2 && (
                      <Image
                        alt={session.alpha3 ?? t('general.unknown')}
                        className="rounded-[2px]"
                        height={20}
                        src={`/countries/${session.alpha2.toLowerCase()}.svg`}
                        width={20}
                        onError={(e) => {
                          e.preventDefault();
                          (e.target as HTMLImageElement).src =
                            '/countries/unknown.svg';
                        }}
                      />
                    )}
                    {session.ipAddress === '::1'
                      ? '127.0.0.1'
                      : session.ipAddress}
                  </TableCell>
                  <TableCell className="truncate">
                    <DateConverter date={session.createdAt} />
                  </TableCell>
                  <TableCell className="py-0 text-right">
                    {session.current ? (
                      t('dashboard.profile.current_session')
                    ) : (
                      <LoadingButton
                        pending={pendingSingleId === session.id}
                        size="sm"
                        variant="ghost"
                        onClick={() => onSessionLogoutSubmit(session.id)}
                      >
                        <LogOut size={20} />
                      </LoadingButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          )}
        </Table>
        <LoadingButton
          className="mt-4"
          disabled={!hasOtherThanCurrentSession}
          pending={submitting}
          size="sm"
          variant="secondary"
          onClick={onSessionLogoutAllSubmit}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('dashboard.profile.logout_all_sessions')}
        </LoadingButton>
      </CardContent>
    </Card>
  );
}
