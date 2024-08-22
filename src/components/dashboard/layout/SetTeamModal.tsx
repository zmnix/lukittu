'use client';
import { TeamsPostResponse } from '@/app/api/teams/route';
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
import { useContext, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

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
  const [pending, startTransition] = useTransition();

  const form = useForm<SetTeamSchema>({
    resolver: zodResolver(setTeamSchema(t)),
    defaultValues: {
      name: '',
    },
  });

  const handleTeamCreate = async (data: SetTeamSchema) => {
    const response = await fetch('/api/teams', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const responseData = (await response.json()) as TeamsPostResponse;

    return responseData;
  };

  const onSubmit = (data: SetTeamSchema) => {
    startTransition(async () => {
      const res = await handleTeamCreate(data);
      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof SetTeamSchema, {
            type: 'manual',
            message: res.message,
          });
        }
      }

      if ('team' in res && authCtx.session) {
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

      onOpenChange(false);
    });
  };

  useEffect(() => {
    form.reset({
      id: teamToEdit?.id,
      name: teamToEdit?.name || '',
    });
  }, [form, teamToEdit?.name, teamToEdit?.id]);

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[525px]">
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
          <form className="px-4" onSubmit={form.handleSubmit(onSubmit)}>
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
              onClick={() => onOpenChange(false)}
            >
              {t('general.close')}
            </LoadingButton>
          </div>
          <div>
            <LoadingButton
              className="w-full"
              pending={pending}
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
