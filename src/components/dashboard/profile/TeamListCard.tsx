'use client';
import leaveTeam from '@/actions/profile/leave-team';
import transferTeamOwnership from '@/actions/profile/transfer-team-ownership';
import { TeamDeleteResponse } from '@/app/api/teams/[slug]/route';
import { TeamsGetResponse, TeamWithUsers } from '@/app/api/teams/route';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useModal } from '@/hooks/useModal';
import { AuthContext } from '@/providers/AuthProvider';
import { Team, User } from '@prisma/client';
import { EllipsisVertical } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { DeleteTeamConfirmModal } from './TeamDeleteConfirmModal';
import { LeaveTeamConfirmModal } from './TeamLeaveConfirmModal';
import { TransferTeamOwnershipModal } from './TransferTeamOwnershipModal';

export default function TeamListCard() {
  const authCtx = useContext(AuthContext);

  const [teams, setTeams] = useState<TeamWithUsers[]>([]);
  const [teamLeaveConfirmation, setTeamLeaveConfirmation] =
    useState<Team | null>(null);
  const [teamTransferConfirmation, setTeamTransferConfirmation] = useState<
    (Team & { users: User[] }) | null
  >(null);
  const [teamDeleteConfirmation, setTeamDeleteConfirmation] = useState<
    (Team & { users: User[] }) | null
  >(null);
  const [teamDeleteConfirmationModalOpen, setTeamDeleteConfirmationModalOpen] =
    useState(false);
  const [teamLEaveConfirmationModalOpen, setTeamLeaveConfirmationModalOpen] =
    useState(false);
  const [
    teamTransferConfirmationModalOpen,
    setTeamTransferConfirmationModalOpen,
  ] = useState(false);

  const { ConfirmModal, openConfirmModal } = useModal();
  const t = useTranslations();
  const router = useRouter();

  useEffect(() => {
    const handleTeamGet = async () => {
      const response = await fetch('/api/teams');
      const data = (await response.json()) as TeamsGetResponse;
      if ('teams' in data) {
        setTeams(data.teams);
      }
    };

    handleTeamGet();
  }, []);

  const handleTeamLeave = async (team: Team) => {
    const res = await leaveTeam(team.id);

    if (res.isError) {
      return openConfirmModal({
        title: t('general.error'),
        description: res.message,
      });
    }

    const session = authCtx.session;
    if (session) {
      authCtx.setSession({
        ...session,
        user: {
          ...session.user,
          teams: session.user.teams.filter((t) => t.id !== team.id),
        },
      });
    }
    router.refresh();
  };

  const handleDeleteTeam = async (team: Team, teamNameConfirmation: string) => {
    const response = await fetch(`/api/teams/${team.id}`, {
      method: 'DELETE',
      body: JSON.stringify({ teamNameConfirmation }),
    });

    const responseData = (await response.json()) as TeamDeleteResponse;

    return responseData;
  };

  const handleTeamDelete = async (team: Team, teamNameConfirmation: string) => {
    const res = await handleDeleteTeam(team, teamNameConfirmation);

    if ('message' in res) {
      return openConfirmModal({
        title: t('general.error'),
        description: res.message,
      });
    }

    const session = authCtx.session;
    if (session) {
      authCtx.setSession({
        ...session,
        user: {
          ...session.user,
          teams: session.user.teams.filter((t) => t.id !== team.id),
        },
      });
    }
    router.refresh();
  };

  const handleTeamDeleteConfirm = (team: Team & { users: User[] }) => {
    if (team.users.length > 1) {
      return openConfirmModal({
        title: t('dashboard.profile.delete_team_not_empty_title'),
        description: t.rich(
          'dashboard.profile.delete_team_not_empty_description',
          {
            teamName: team.name,
            strong: (child) => <strong>{child}</strong>,
          },
        ),
      });
    }

    setTeamDeleteConfirmation(team);
    setTeamDeleteConfirmationModalOpen(true);
  };

  const handleTeamTransfer = async (team: Team, newOwnerId: number) => {
    const res = await transferTeamOwnership(team.id, newOwnerId);

    if (res.isError) {
      return openConfirmModal({
        title: t('general.error'),
        description: res.message,
      });
    }

    const session = authCtx.session;
    if (session) {
      authCtx.setSession({
        ...session,
        user: {
          ...session.user,
          teams: session.user.teams.map((t) =>
            t.id === team.id ? { ...t, isOwner: false } : t,
          ),
        },
      });
    }
  };

  return (
    <>
      <ConfirmModal />
      <LeaveTeamConfirmModal
        open={teamLEaveConfirmationModalOpen}
        team={teamLeaveConfirmation}
        onConfirm={handleTeamLeave}
        onOpenChange={setTeamLeaveConfirmationModalOpen}
      />
      <DeleteTeamConfirmModal
        open={teamDeleteConfirmationModalOpen}
        team={teamDeleteConfirmation}
        onConfirm={handleTeamDelete}
        onOpenChange={setTeamDeleteConfirmationModalOpen}
      />
      <TransferTeamOwnershipModal
        open={teamTransferConfirmationModalOpen}
        team={teamTransferConfirmation}
        onConfirm={handleTeamTransfer}
        onOpenChange={setTeamTransferConfirmationModalOpen}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            {t('general.teams')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="truncate">{t('general.name')}</TableHead>
                <TableHead className="truncate">{t('general.role')}</TableHead>
                <TableHead className="truncate text-right">
                  {t('general.actions')}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="truncate">{team.name}</TableCell>
                  <TableCell className="truncate">
                    <Badge variant="outline">
                      {team.ownerId === authCtx.session?.user.id
                        ? t('general.owner')
                        : t('general.member')}
                    </Badge>
                  </TableCell>
                  <TableCell className="truncate py-0 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost">
                          <EllipsisVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="font-medium"
                        forceMount
                      >
                        <DropdownMenuItem
                          className="hover:cursor-pointer"
                          disabled={team.ownerId !== authCtx.session?.user.id}
                          onClick={() => {
                            setTeamTransferConfirmation(team);
                            setTeamTransferConfirmationModalOpen(true);
                          }}
                        >
                          {t('dashboard.profile.transfer_ownership')}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive hover:cursor-pointer"
                          onClick={() => {
                            if (team.ownerId === authCtx.session?.user.id) {
                              handleTeamDeleteConfirm(team);
                            } else {
                              setTeamLeaveConfirmationModalOpen(true);
                              setTeamLeaveConfirmation(team);
                            }
                          }}
                        >
                          {team.ownerId === authCtx.session?.user.id
                            ? t('dashboard.profile.delete_team')
                            : t('dashboard.profile.leave_team')}
                          ...
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
