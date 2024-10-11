'use client';
import {
  ITeamsMembersGetResponse,
  ITeamsMembersGetSuccessResponse,
} from '@/app/api/(dashboard)/teams/members/route';
import { DateConverter } from '@/components/shared/DateConverter';
import TablePagination from '@/components/shared/table/TablePagination';
import TableSkeleton from '@/components/shared/table/TableSkeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTableScroll } from '@/hooks/useTableScroll';
import { cn } from '@/lib/utils/tailwind-helpers';
import { getInitials } from '@/lib/utils/text-helpers';
import { AuthContext } from '@/providers/AuthProvider';
import { MemberModalProvider } from '@/providers/MemberModalProvider';
import { TeamContext } from '@/providers/TeamProvider';
import { Filter, Search } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import Image from 'next/image';
import { useContext, useEffect, useState } from 'react';
import { toast } from 'sonner';
import AddMemberButton from './AddMemberButton';
import { MembersActionDropdown } from './MembersActionDropdown';
import MembersMobileFiltersModal from './MembersMobileFiltersModal';

export function MembersTable() {
  const locale = useLocale();
  const t = useTranslations();
  const { showDropdown, containerRef } = useTableScroll();
  const ctx = useContext(AuthContext);
  const teamCtx = useContext(TeamContext);

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState<
    ITeamsMembersGetSuccessResponse['members']
  >([]);
  const [totalMembers, settotalMembers] = useState(1);
  const [debounceSearch, setDebounceSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    (async () => {
      if (!teamCtx.selectedTeam) return;

      setLoading(true);

      try {
        const searchParams = new URLSearchParams({
          page: page.toString(),
          pageSize: pageSize.toString(),
          ...(search && { search }),
        });

        const response = await fetch(
          `/api/teams/members?${searchParams.toString()}`,
        );

        const data = (await response.json()) as ITeamsMembersGetResponse;

        if ('message' in data) {
          return toast.error(data.message);
        }

        setMembers(data.members);
        settotalMembers(data.totalResults);
      } catch (error: any) {
        toast.error(error.message ?? t('general.server_error'));
      } finally {
        setLoading(false);
      }
    })();
  }, [page, pageSize, search, t, teamCtx.selectedTeam]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(debounceSearch);
    }, 500);

    return () => {
      clearTimeout(timeout);
    };
  }, [debounceSearch]);

  const isTeamOwner = members.some(
    (member) =>
      'isOwner' in member &&
      member.isOwner &&
      member.id === ctx.session?.user.id,
  );

  return (
    <MemberModalProvider>
      <MembersMobileFiltersModal
        open={mobileFiltersOpen}
        search={debounceSearch}
        setSearch={setSearch}
        onOpenChange={setMobileFiltersOpen}
      />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-xl font-bold">
            {t('dashboard.navigation.members')}
            <div className="ml-auto flex gap-2">
              <Button
                className="lg:hidden"
                size="sm"
                variant="outline"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <Filter className="h-4 w-4" />
              </Button>
              <AddMemberButton isTeamOwner={isTeamOwner} />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <>
            <div className="relative mb-4 flex min-w-[33%] max-w-xs items-center max-lg:hidden">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
              <Input
                className="pl-8"
                placeholder={t('dashboard.members.search_member')}
                value={debounceSearch}
                onChange={(e) => {
                  setDebounceSearch(e.target.value);
                }}
              />
            </div>
            <div className="flex flex-col md:hidden">
              {loading
                ? Array.from({ length: 5 }).map((_, index) => (
                    <div
                      key={index}
                      className="group relative flex items-center justify-between border-b py-3 first:border-t"
                    >
                      <Skeleton className="h-10 w-full" />
                    </div>
                  ))
                : members.map((member) => (
                    <div
                      key={member.id}
                      className="group relative flex items-center justify-between border-b py-3 first:border-t"
                    >
                      <div className="absolute inset-0 -mx-2 rounded-lg" />
                      <div className="z-10 flex items-center gap-2">
                        <Avatar className="h-12 w-12 border">
                          <AvatarImage
                            src={'imageUrl' in member ? member.imageUrl! : ''}
                            asChild
                          >
                            {'imageUrl' in member && member.imageUrl && (
                              <Image alt="Avatar" src={member.imageUrl} fill />
                            )}
                          </AvatarImage>
                          <AvatarFallback className="bg-primary text-xs text-white">
                            {getInitials(
                              'fullName' in member ? member.fullName : '??',
                            )}
                          </AvatarFallback>
                        </Avatar>
                        <div className="z-10 grid">
                          <p className="truncate font-medium">{`${member.email}`}</p>
                          <div className="flex items-center gap-1">
                            <div className="grid text-xs font-semibold text-muted-foreground">
                              <p className="truncate">{member.email}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="z-10 flex items-center space-x-2">
                        <span className="rounded-full px-2 py-1 text-xs font-medium">
                          <Badge className="text-xs" variant="outline">
                            {'isOwner' in member && member.isOwner
                              ? t('general.owner')
                              : t('general.member')}
                          </Badge>
                        </span>
                        <MembersActionDropdown
                          isSelf={member.id === ctx.session?.user.id}
                          isTeamOwner={isTeamOwner}
                          member={member}
                        />
                      </div>
                    </div>
                  ))}
            </div>
            <Table
              className="relative max-md:hidden"
              containerRef={containerRef}
            >
              <TableHeader>
                <TableRow>
                  <TableHead className="truncate">
                    {t('general.member')}
                  </TableHead>
                  <TableHead className="truncate">
                    {t('general.role')}
                  </TableHead>
                  <TableHead className="truncate">
                    {t('general.last_login')}
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
                <TableSkeleton columns={4} rows={6} />
              ) : (
                <TableBody>
                  {members.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell className="truncate">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 border">
                            <AvatarImage
                              src={'imageUrl' in member ? member.imageUrl! : ''}
                              asChild
                            >
                              {'imageUrl' in member && member.imageUrl && (
                                <Image
                                  alt="Avatar"
                                  src={
                                    'imageUrl' in member ? member.imageUrl : ''
                                  }
                                  fill
                                />
                              )}
                            </AvatarImage>
                            <AvatarFallback className="bg-primary text-xs text-white">
                              {getInitials(
                                'fullName' in member ? member.fullName : '??',
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <b>
                              {'fullName' in member ? member.fullName : 'N/A'}
                            </b>
                            <p className="text-xs text-muted-foreground">
                              {member.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="truncate">
                        <Badge className="text-xs" variant="outline">
                          {'isOwner' in member && member.isOwner
                            ? t('general.owner')
                            : t('general.member')}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className="truncate"
                        title={new Date(
                          'lastLoginAt' in member
                            ? (member.lastLoginAt ?? '')
                            : '',
                        ).toLocaleString(locale)}
                      >
                        {'isInvitation' in member ? (
                          <Badge className="text-xs" variant="secondary">
                            {t('general.invitation_sent')}
                          </Badge>
                        ) : member.lastLoginAt ? (
                          <DateConverter date={member.lastLoginAt} />
                        ) : (
                          <span className="text-muted-foreground">
                            {t('general.unknown')}
                          </span>
                        )}
                      </TableCell>
                      <TableCell
                        className={cn(
                          'sticky right-0 w-[50px] truncate px-2 py-0 text-right',
                          {
                            'bg-background drop-shadow-md': showDropdown,
                          },
                        )}
                      >
                        <MembersActionDropdown
                          isSelf={member.id === ctx.session?.user.id}
                          isTeamOwner={isTeamOwner}
                          member={member}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              )}
            </Table>
            <TablePagination
              page={page}
              pageSize={pageSize}
              results={members.length}
              setPage={setPage}
              setPageSize={setPageSize}
              totalItems={totalMembers}
              totalPages={Math.ceil(totalMembers / pageSize)}
            />
          </>
        </CardContent>
      </Card>
    </MemberModalProvider>
  );
}
