'use client';
import { ISessionsSignOutResponse } from '@/app/api/sessions/[slug]/route';
import {
  ISessionsGetResponse,
  ISessionsGetSuccessResponse,
  ISessionsSignOutAllResponse,
} from '@/app/api/sessions/route';
import LoadingButton from '@/components/shared/LoadingButton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getRelativeTimeString } from '@/lib/utils/date-helpers';
import { LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import UAParser from 'ua-parser-js';

export default function LoginSessionsCard() {
  const [sessions, setSessions] = useState<
    ISessionsGetSuccessResponse['sessions']
  >([]);
  const [pendingSingleId, setPendingSingleId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslations();
  const locale = useLocale();

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

  const parseDeviceFromUserAgent = (userAgent: string | null) => {
    if (!userAgent) return null;
    const parser = new UAParser(userAgent);
    const browser = parser.getBrowser();
    const os = parser.getOS();

    if (browser.name && os.name) {
      return `${browser.name} - ${os.name}`;
    } else {
      return null;
    }
  };

  const hasOtherThanCurrentSession = sessions.some(
    (session) => !session.current,
  );

  const handleSignOutSingleSession = async (id: number) => {
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

  const onSessionLogoutSubmit = async (id: number) => {
    setPendingSingleId(id);
    try {
      const res = await handleSignOutSingleSession(id);

      if ('message' in res) {
        toast.error(res.message);
        return;
      }

      setSessions((prev) => prev.filter((session) => session.id !== id));
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setPendingSingleId(null);
    }
  };

  const onSessionLogoutAllSubmit = async () => {
    setLoading(true);
    try {
      const res = await handleSignOutAllSessions();
      if ('message' in res) {
        toast.error(res.message);
        return;
      }

      setSessions((prev) => prev.filter((session) => session.current));
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
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
              <TableHead className="truncate">
                {t('general.location')}
              </TableHead>
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
          <TableBody>
            {sessions?.map((session) => (
              <TableRow key={session.id}>
                <TableCell className="truncate">
                  {session.country ?? 'N/A'}
                </TableCell>
                <TableCell className="truncate">
                  {parseDeviceFromUserAgent(session.userAgent) ?? 'N/A'}
                </TableCell>
                <TableCell className="truncate">
                  {session.ipAddress === '::1'
                    ? '127.0.0.1'
                    : session.ipAddress}
                </TableCell>
                <TableCell className="truncate">
                  {getRelativeTimeString(session.createdAt, locale)}
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
        </Table>
        <LoadingButton
          className="mt-4"
          disabled={!hasOtherThanCurrentSession}
          pending={loading}
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
