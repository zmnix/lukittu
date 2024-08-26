'use client';
import { IUsersChangePasswordResponse } from '@/app/api/users/change-password/route';
import LoadingButton from '@/components/shared/LoadingButton';
import PasswordIndicator from '@/components/shared/PasswordIndicator';
import { Button } from '@/components/ui/button';
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
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from '@/components/ui/responsive-dialog';
import {
  ChangePasswordSchema,
  changePasswordSchema,
} from '@/lib/validation/profile/change-password-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { EyeIcon, EyeOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';

interface ChangePasswordModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ChangePasswordModal({
  open,
  onOpenChange,
}: ChangePasswordModalProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema(t)),
    defaultValues: {
      newPassword: '',
      password: '',
      passwordConfirmation: '',
    },
  });

  const handleChangePassword = async (payload: ChangePasswordSchema) => {
    const response = await fetch('/api/users/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as IUsersChangePasswordResponse;

    return data;
  };

  const onSubmit = (data: ChangePasswordSchema) => {
    startTransition(async () => {
      const res = await handleChangePassword(data);
      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof ChangePasswordSchema, {
            type: 'manual',
            message: res.message,
          });
        }
      }

      form.reset();
      onOpenChange(false);
    });
  };

  return (
    <ResponsiveDialog open={open} onOpenChange={onOpenChange}>
      <ResponsiveDialogContent className="sm:max-w-[525px]">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {t('dashboard.profile.change_password')}
          </ResponsiveDialogTitle>
        </ResponsiveDialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center">
                    <FormLabel htmlFor="password">
                      {t('general.password')}
                    </FormLabel>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Input
                        id="password"
                        placeholder="********"
                        type={showPassword ? 'text' : 'password'}
                        {...field}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="newPassword">
                      {t('dashboard.profile.new_password')}
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          id="newPassword"
                          placeholder="********"
                          type={showPassword ? 'text' : 'password'}
                          {...field}
                        />
                        <Button
                          className="absolute bottom-1 right-1 h-7 w-7"
                          size="icon"
                          type="button"
                          variant="ghost"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <PasswordIndicator password={form.watch('newPassword')} />
            </div>
            <FormField
              control={form.control}
              name="passwordConfirmation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel htmlFor="passwordConfirmation">
                    {t('auth.reset_password.confirm_password')}
                  </FormLabel>
                  <FormControl>
                    <Input
                      id="passwordConfirmation"
                      placeholder="********"
                      type={showPassword ? 'text' : 'password'}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <button className="hidden" type="submit" />
          </form>
        </Form>
        <ResponsiveDialogFooter>
          <div>
            <LoadingButton
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
              {t('general.save')}
            </LoadingButton>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}
