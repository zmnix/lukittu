'use client';
import createTeam from '@/actions/teams/create-team';
import SubmitButton from '@/components/shared/SubmitButton';
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
  CreateTeamSchema,
  createTeamSchema,
} from '@/lib/validation/team/create-team-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { useForm } from 'react-hook-form';

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
}

export default function CreateTeamModal({
  open,
  onClose,
}: CreateTeamModalProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<CreateTeamSchema>({
    resolver: zodResolver(createTeamSchema(t)),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = (data: CreateTeamSchema) => {
    startTransition(async () => {
      const res = await createTeam(data);
      if (res?.isError) {
        if (res.field) {
          return form.setError(res.field as keyof CreateTeamSchema, {
            type: 'manual',
            message: res.message,
          });
        }
      }

      router.refresh();
      onClose();
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('dashboard.teams.create_team')}</DialogTitle>
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
            <SubmitButton label={t('general.close')} variant="outline" />
          </form>
          <div>
            <SubmitButton
              label={t('general.create')}
              pending={pending}
              onClick={() => form.handleSubmit(onSubmit)()}
            />
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
