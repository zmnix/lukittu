'use client';
import setTeam from '@/actions/teams/set-team';
import LoadingButton from '@/components/shared/LoadingButton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  onClose: () => void;
  team: Team | null;
}

export default function SetTeamModal({
  open,
  onClose,
  team,
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
      onClose();
    });
  };

  useEffect(() => {
    form.reset({
      id: team?.id,
      name: team?.name || '',
    });
  }, [form, team?.name, team?.id]);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {Boolean(team)
              ? t('dashboard.teams.edit_team')
              : t('dashboard.teams.create_team')}
          </DialogTitle>
          <DialogDescription>
            {t('dashboard.teams.create_team_info')}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
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
        <DialogFooter>
          <form action={onClose}>
            <LoadingButton className="w-full" type="submit" variant="outline">
              {t('general.close')}
            </LoadingButton>
          </form>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
