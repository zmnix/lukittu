'use client';
import { ITeamsCreateResponse } from '@/app/api/teams/route';
import LoadingButton from '@/components/shared/LoadingButton';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import {
  SetTeamSchema,
  setTeamSchema,
} from '@/lib/validation/team/set-team-schema';
import { AuthContext } from '@/providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Team } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

interface SetTeamModalProps {
  open: boolean;
  onOpenChange: (boolean: boolean) => void;
  teamToEdit: Team | null;
}

export default function SetTeamModal({
  open,
  onOpenChange,
  teamToEdit,
}: SetTeamModalProps) {
  const t = useTranslations();
  const authCtx = useContext(AuthContext);
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const form = useForm<SetTeamSchema>({
    resolver: zodResolver(setTeamSchema(t)),
    defaultValues: {
      name: '',
    },
  });

  const handleTeamCreate = async (payload: SetTeamSchema) => {
    const response = await fetch('/api/teams', {
      method: 'POST',
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ITeamsCreateResponse;

    return data;
  };

  const handleTeamEdit = async (payload: SetTeamSchema) => {
    const response = await fetch(`/api/teams/${teamToEdit?.id}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as ITeamsCreateResponse;

    return data;
  };

  const onSubmit = async (data: SetTeamSchema) => {
    setLoading(true);
    try {
      const res = teamToEdit
        ? await handleTeamEdit(data)
        : await handleTeamCreate(data);

      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof SetTeamSchema, {
            type: 'manual',
            message: res.message,
          });
        }

        onOpenChange(false);
        return toast.error(res.message ?? t('general.error_occurred'));
      }

      if ('team' in res && authCtx.session && !teamToEdit) {
        if (teamToEdit) {
          authCtx.setSession({
            ...authCtx.session,
            user: {
              ...authCtx.session.user,
              teams: authCtx.session.user.teams.map((team) =>
                team.id === res.team?.id ? res.team : team,
              ),
            },
          });
        } else {
          authCtx.setSession({
            ...authCtx.session,
            user: {
              ...authCtx.session.user,
              teams: [...authCtx.session.user.teams, res.team],
            },
          });
        }
      }

      router.refresh();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    form.reset({
      name: teamToEdit?.name || '',
    });
  }, [form, teamToEdit?.name, teamToEdit?.id]);

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open);
    form.reset();
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={handleOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[625px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {Boolean(teamToEdit)
              ? t('dashboard.teams.edit_team')
              : t('dashboard.teams.create_team')}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t('dashboard.teams.create_team_info')}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form className="max-md:px-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('general.name')}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={t(
                        'dashboard.teams.my_first_team_placeholder',
                      )}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
        <ResponsiveDialogFooter>
          <div>
            <LoadingButton
              className="w-full"
              type="submit"
              variant="outline"
              onClick={() => handleOpenChange(false)}
            >
              {t('general.close')}
            </LoadingButton>
          </div>
          <div>
            <LoadingButton
              className="w-full"
              pending={loading}
              type="submit"
              onClick={() => form.handleSubmit(onSubmit)()}
            >
              {t('general.create')}
            </LoadingButton>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
