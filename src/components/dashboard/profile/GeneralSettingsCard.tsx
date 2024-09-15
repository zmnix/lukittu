'use client';
import { IUsersUpdateResponse } from '@/app/api/(dashboard)/users/route';
import LoadingButton from '@/components/shared/LoadingButton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { Edit, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
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

  const getInitials = (fullName: string) => {
    const initials = fullName
      .split(' ')
      .slice(0, 2)
      .map((name) => name.charAt(0))
      .join('');

    return initials;
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
        return form.setError(res.field as keyof UpdateProfileSchema, {
          type: 'manual',
          message: res.message,
        });
      }

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
              className="flex max-w-md flex-1 flex-col gap-6"
              onSubmit={form.handleSubmit(onSubmit)}
            >
              <div>
                <div className="relative">
                  <div className="mb-1 text-sm font-semibold">
                    {t('general.avatar')}
                  </div>
                  <Avatar className="h-32 w-32 border">
                    <AvatarImage src={user?.avatarUrl} asChild>
                      {user?.avatarUrl && (
                        <Image alt="Avatar" src={user.avatarUrl} fill />
                      )}
                    </AvatarImage>
                    <AvatarFallback className="bg-primary text-2xl text-white">
                      {getInitials(user?.fullName ?? '??')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="max-w-md text-sm text-muted-foreground">
                  {t.rich('dashboard.gravatar.description', {
                    link: (children) => (
                      <Button className="p-0" size="sm" variant="link" asChild>
                        <Link
                          href="https://gravatar.com"
                          rel="noopener noreferrer"
                          target="_blank"
                        >
                          {children}
                          <ExternalLink className="ml-1 h-4 w-4" />
                        </Link>
                      </Button>
                    ),
                  })}
                </div>
              </div>
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
                    type="button"
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
