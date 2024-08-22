'use client';
import { IResetPasswordResponse } from '@/app/api/auth/reset-password/route';
import LoadingButton from '@/components/shared/LoadingButton';
import PasswordIndicator from '@/components/shared/PasswordIndicator';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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
  ResetPasswordSchema,
  resetPasswordSchema,
} from '@/lib/validation/auth/reset-password-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useEffect, useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';

interface ResetPasswordCardProps {
  token: string;
}

export default function ResetPasswordCard({ token }: ResetPasswordCardProps) {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordResetSuccess, setPasswordResetSuccess] = useState(false);

  const form = useForm<ResetPasswordSchema>({
    resolver: zodResolver(resetPasswordSchema(t)),
    defaultValues: {
      password: '',
      passwordConfirmation: '',
    },
  });

  const formWatcher = useWatch({
    control: form.control,
    defaultValue: form.getValues(),
  });

  useEffect(() => {
    setFormError(null);
  }, [formWatcher]);

  const handleResetPassword = async (
    data: ResetPasswordSchema & { token: string },
  ) => {
    const response = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ...data, token }),
    });

    const responseData = (await response.json()) as IResetPasswordResponse;

    return responseData;
  };

  const onSubmit = async (data: ResetPasswordSchema) => {
    startTransition(async () => {
      const res = await handleResetPassword({
        ...data,
        token: token as string,
      });
      if ('message' in res) {
        if (res.field) {
          return form.setError(res.field as keyof ResetPasswordSchema, {
            type: 'manual',
            message: res.message,
          });
        }

        return setFormError(res.message ?? t('general.error_occurred'));
      }

      setPasswordResetSuccess(true);
    });
  };

  return (
    <>
      <Card className="mx-auto w-full max-w-lg p-6 max-md:max-w-md max-md:px-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {!passwordResetSuccess
              ? t('auth.reset_password.title')
              : t('auth.reset_password.reset_success_title')}
          </CardTitle>
          <CardDescription>
            {!passwordResetSuccess
              ? t('auth.reset_password.description')
              : t('auth.reset_password.reset_success_description')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!passwordResetSuccess ? (
            <>
              {formError && (
                <Alert className="mb-6" variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>{t('general.error')}</AlertTitle>
                  <AlertDescription>{formError}</AlertDescription>
                </Alert>
              )}
              <Form {...form}>
                <form
                  className="space-y-4"
                  onSubmit={form.handleSubmit(onSubmit)}
                >
                  <div className="space-y-2">
                    <FormField
                      control={form.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel htmlFor="password">
                            {t('general.password')}
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                id="password"
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
                    <PasswordIndicator password={form.watch('password')} />
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
                  <LoadingButton
                    className="w-full"
                    pending={pending}
                    type="submit"
                  >
                    {t('auth.reset_password.reset_password')}
                  </LoadingButton>
                </form>
              </Form>
            </>
          ) : (
            <Button className="w-full" asChild>
              <Link href="/auth/login">{t('general.back_to_login')}</Link>
            </Button>
          )}
        </CardContent>
        {!passwordResetSuccess && (
          <CardFooter>
            <p className="text-sm">
              {t('auth.reset_password.dont_want_to_reset')}{' '}
              <Link className="font-semibold text-primary" href="/auth/login">
                {t('general.back_to_login')}
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
    </>
  );
}
