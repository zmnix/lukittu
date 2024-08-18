'use client';
import setTeam from '@/actions/teams/set-team';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { Team } from '@prisma/client';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';

interface SetTeamModalProps {
  open: boolean;
  // eslint-disable-next-line no-unused-vars
  onOpenChange: (boolean: boolean) => void;
  teamToEdit: Team | null;
}

export default function SetTeamModal({
  open,
  onOpenChange,
  teamToEdit,
}: SetTeamModalProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<SetTeamSchema>({
    resolver: zodResolver(setTeamSchema(t)),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = (data: SetTeamSchema) => {
    startTransition(async () => {
      const res = await setTeam(data);
      if (res?.isError) {
        if (res.field) {
          return form.setError(res.field as keyof SetTeamSchema, {
            type: 'manual',
            message: res.message,
          });
        }
      }

      router.refresh();
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
