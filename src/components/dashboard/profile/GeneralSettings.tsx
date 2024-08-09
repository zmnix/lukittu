'use client';
import updateProfile from '@/actions/profile/update-profile';
import LoadingButton from '@/components/shared/LoadingButton';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { firstLetterUppercase } from '@/lib/utils/text-helpers';
import {
  UpdateProfileSchema,
  updateProfileSchema,
} from '@/lib/validation/profile/update-profile-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from '@prisma/client';
import { Edit } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import ChangePasswordModal from './ChangePasswordModal';

interface GeneralSettingsProps {
  user: User;
}

export default function GeneralSettings({
  user: initialUser,
}: GeneralSettingsProps) {
  const t = useTranslations();
  const [user, setUser] = useState<User>(initialUser);
  const [pending, startTransition] = useTransition();
  const [edit, setEdit] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema(t)),
    defaultValues: {
      fullName: user.fullName,
    },
  });

  const handleCancel = () => {
    setEdit(false);
    form.reset();
  };

  const onSubmit = (data: UpdateProfileSchema) => {
    startTransition(async () => {
      const res = await updateProfile(data);
      if (res.isError) {
        form.setError(res.field as keyof UpdateProfileSchema, {
          type: 'manual',
          message: res.message,
        });
      }

      if (!res.isError) {
        setUser((prev) => ({ ...prev, fullName: data.fullName }));
        setEdit(false);
      }
    });
  };

  const isTouched = form.formState.isDirty || form.formState.isSubmitting;

  return (
    <>
      {changePasswordModalOpen && (
        <ChangePasswordModal
          open={changePasswordModalOpen}
          onClose={() => setChangePasswordModalOpen(false)}
        />
      )}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl font-bold">
            {t('general.user')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              className="flex max-w-lg flex-col gap-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div className="flex min-h-10 items-center text-sm max-sm:flex-col max-sm:items-start max-sm:gap-2">
                <div className="w-1/3 font-semibold">{t('general.email')}</div>
                <div className="w-2/3">{user.email}</div>
              </div>
              <div className="flex min-h-10 items-start text-sm max-sm:flex-col max-sm:items-start max-sm:gap-2">
                <div className="flex h-full min-h-10 w-1/3 items-center font-semibold max-sm:h-auto max-sm:min-h-[auto]">
                  {t('general.name')}
                </div>
                {edit ? (
                  <FormField
                    control={form.control}
                    name="fullName"
                    render={({ field }) => (
                      <FormItem className="w-2/3 max-sm:w-full">
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : (
                  <div className="flex min-h-10 w-2/3 items-center max-sm:w-full">
                    {user.fullName}
                  </div>
                )}
              </div>
              <div className="flex min-h-10 items-center text-sm max-sm:h-auto max-sm:flex-col max-sm:items-start max-sm:gap-2">
                <div className="w-1/3 font-semibold max-sm:w-full">
                  {t('general.password')}
                </div>
                {edit ? (
                  <Button
                    disabled={user.provider !== 'CREDENTIALS'}
                    size="sm"
                    variant="secondary"
                    onClick={() => setChangePasswordModalOpen(true)}
                  >
                    {t('dashboard.profile.change_password')}...
                  </Button>
                ) : (
                  <div className="w-2/3 max-sm:w-full">••••••••</div>
                )}
              </div>
              <div className="flex min-h-10 items-center text-sm max-sm:flex-col max-sm:items-start max-sm:gap-2">
                <div className="w-1/3 font-semibold">
                  {t('dashboard.profile.login_provider')}
                </div>
                <div className="w-2/3">
                  {firstLetterUppercase(
                    t(
                      `auth.oauth.${user.provider.toLowerCase() as 'google' | 'credentials'}`,
                    ),
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                {edit ? (
                  <>
                    <Button
                      size="sm"
                      type="button"
                      variant="secondary"
                      onClick={handleCancel}
                    >
                      {t('general.cancel')}
                    </Button>
                    <LoadingButton
                      disabled={!isTouched}
                      pending={pending}
                      size="sm"
                      type="submit"
                    >
                      {t('general.save')}
                    </LoadingButton>
                  </>
                ) : (
                  <Button
                    className="flex items-center gap-1"
                    size="sm"
                    type="button"
                    variant="secondary"
                    onClick={() => setEdit(true)}
                  >
                    <Edit className="mr-2 h-4 w-4" />
                    {t('general.edit')}
                  </Button>
                )}
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </>
  );
}
