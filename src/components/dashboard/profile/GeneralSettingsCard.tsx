'use client';
import { IUsersUpdateResponse } from '@/app/api/users/route';
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
import { AuthContext } from '@/providers/AuthProvider';
import { zodResolver } from '@hookform/resolvers/zod';
import { Edit } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import ChangePasswordModal from './ChangePasswordModal';

export default function GeneralSettingsCard() {
  const t = useTranslations();
  const authCtx = useContext(AuthContext);
  const user = authCtx.session?.user;
  const [edit, setEdit] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema(t)),
    defaultValues: {
      fullName: '',
    },
  });

  useEffect(() => {
    if (user) {
      form.reset({ fullName: user.fullName });
    }
  }, [form, user]);

  const handleCancel = () => {
    setEdit(false);
    form.reset();
  };

  const handleProfileUpdate = async (payload: UpdateProfileSchema) => {
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as IUsersUpdateResponse;

    return data;
  };

  const onSubmit = async (data: UpdateProfileSchema) => {
    setLoading(true);
    try {
      const res = await handleProfileUpdate(data);
      if ('message' in res) {
        form.setError(res.field as keyof UpdateProfileSchema, {
          type: 'manual',
          message: res.message,
        });
      }

      if ('success' in res) {
        const session = authCtx.session;
        if (session) {
          authCtx.setSession({
            ...session,
            user: {
              ...session.user,
              fullName: data.fullName,
            },
          });
        }
        setEdit(false);
      }
    } catch (error: any) {
      toast.error(error.message ?? t('general.error_occurred'));
    } finally {
      setLoading(false);
    }
  };

  const isTouched = form.formState.isDirty || form.formState.isSubmitting;

  return (
    <>
      <ChangePasswordModal
        open={changePasswordModalOpen}
        onOpenChange={setChangePasswordModalOpen}
      />
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
                <div className="w-2/3">{user?.email}</div>
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
                    {user?.fullName}
                  </div>
                )}
              </div>
              <div className="flex min-h-10 items-center text-sm max-sm:h-auto max-sm:flex-col max-sm:items-start max-sm:gap-2">
                <div className="w-1/3 font-semibold max-sm:w-full">
                  {t('general.password')}
                </div>
                {edit ? (
                  <Button
                    disabled={user?.provider !== 'CREDENTIALS'}
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
                      `auth.oauth.${user?.provider.toLowerCase() as 'google' | 'credentials'}`,
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
                      pending={loading}
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
