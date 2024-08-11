'use client';
import signoutAllSessions from '@/actions/profile/sign-out-all-sessions';
import signoutSession from '@/actions/profile/sign-out-session';
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
import { Session } from '@prisma/client';
import { LogOut } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import UAParser from 'ua-parser-js';

interface LoginSessionsProps {
  sessions: (Session & { current: boolean })[];
}

export default function LoginSessionsCard({
  sessions: initialSessions,
}: LoginSessionsProps) {
  const [sessions, setSessions] =
    useState<(Session & { current: boolean })[]>(initialSessions);
  const [pendingSingleId, setPendingSingleId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const t = useTranslations();
  const locale = useLocale();

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

  const handleSessionLogout = async (sessionId: string) => {
    setPendingSingleId(sessionId);
    try {
      const res = await signoutSession(sessionId);
      if (!res.isError) {
        setSessions((prev) =>
          prev.filter((session) => session.sessionId !== sessionId),
        );
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setPendingSingleId(null);
    }
  };

  const handleLogoutAll = async () => {
    startTransition(async () => {
      const res = await signoutAllSessions();
      if (!res.isError) {
        setSessions((prev) => prev.filter((session) => session.current));
      }
    });
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
            {sessions.map((session) => (
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
                <TableCell className="text-right">
                  {session.current ? (
                    t('dashboard.profile.current_session')
                  ) : (
                    <LoadingButton
                      pending={pendingSingleId === session.sessionId}
                      size="sm"
                      variant="ghost"
                      onClick={() => handleSessionLogout(session.sessionId)}
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
          pending={pending}
          size="sm"
          variant="secondary"
          onClick={handleLogoutAll}
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('dashboard.profile.logout_all_sessions')}
        </LoadingButton>
      </CardContent>
    </Card>
  );
}
