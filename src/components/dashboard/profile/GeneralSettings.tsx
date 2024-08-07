'use client';
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
import {
  UpdateProfileSchema,
  updateProfileSchema,
} from '@/lib/validation/profile/update-profile';
import { zodResolver } from '@hookform/resolvers/zod';
import { User } from '@prisma/client';
import { Edit } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

interface GeneralSettingsProps {
  user: User;
}

export default function GeneralSettings({ user }: GeneralSettingsProps) {
  const t = useTranslations();
  const [edit, setEdit] = useState(false);

  const form = useForm<UpdateProfileSchema>({
    resolver: zodResolver(updateProfileSchema(t)),
    defaultValues: {
      fullName: user.fullName,
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl font-bold">
          {t('general.user')}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="flex max-w-md flex-col gap-6">
            <div className="flex h-10 items-center text-sm">
              <div className="w-1/3 font-semibold">{t('general.email')}</div>
              <div className="w-2/3">{user.email}</div>
            </div>
            <div className="flex h-10 items-center text-sm">
              <div className="w-1/3 font-semibold">{t('general.name')}</div>
              {edit ? (
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ) : (
                <div className="w-2/3">{user.fullName}</div>
              )}
            </div>
            <div className="flex h-10 items-center text-sm">
              <div className="w-1/3 font-semibold">{t('general.password')}</div>
              {edit ? (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setEdit(false)}
                >
                  {t('dashboard.profile.change_password')}...
                </Button>
              ) : (
                <div className="w-2/3">••••••••</div>
              )}
            </div>
            <div className="flex h-10 items-center text-sm">
              <div className="w-1/3 font-semibold">
                {t('dashboard.profile.login_provider')}
              </div>
              <div className="w-2/3">
                {t(
                  `auth.oauth.${user.provider.toLowerCase() as 'google' | 'credentials'}`,
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            {edit ? (
              <>
                <Button
                  type="submit"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEdit(false)}
                >
                  {t('general.cancel')}
                </Button>
                <Button type="submit" size="sm">
                  {t('general.save')}
                </Button>
              </>
            ) : (
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => setEdit(true)}
              >
                <Edit className="mr-2 h-4 w-4" />
                {t('general.edit')}
              </Button>
            )}
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
