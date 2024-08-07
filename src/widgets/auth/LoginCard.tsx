'use client';
import loginWithCredentials from '@/actions/auth/login';
import LoginWithGoogleButton from '@/components/auth/LoginWithGoogleButton';
import OauthLoginFailedccessModal from '@/components/auth/OauthLoginFailedModal';
import ResendVerifyEmailModal from '@/components/auth/ResendVerifyEmailModal';
import SubmitButton from '@/components/shared/SubmitButton';
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
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { LoginSchema, loginSchema } from '@/lib/validation/auth/login-schema';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertCircle, EyeIcon, EyeOffIcon } from 'lucide-react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { useForm, useWatch } from 'react-hook-form';

export default function LoginCard() {
  const t = useTranslations();
  const [pending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [resendVerifyEmailModalOpen, setResendVerifyEmailModalOpen] =
    useState(false);

  const searchParams = useSearchParams();

  const error = searchParams.get('error');
  const provider = searchParams.get('provider');

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema(t)),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const formWatcher = useWatch({
    control: form.control,
    defaultValue: form.getValues(),
  });

  useEffect(() => {
    setFormError(null);
  }, [formWatcher]);

  const onSubmit = (data: LoginSchema) => {
    startTransition(async () => {
      const res = await loginWithCredentials(data);
      if (res?.isError) {
        if (res.reverifyEmail) {
          return setResendVerifyEmailModalOpen(true);
        }

        if (res.field) {
          return form.setError(res.field as keyof LoginSchema, {
            type: 'manual',
            message: res.message,
          });
        }

        // Fallback should never happen
        return setFormError(res.message ?? 'An error occurred');
      }
    });
  };

  return (
    <>
      {error && (
        <OauthLoginFailedccessModal error={error} provider={provider} />
      )}
      {resendVerifyEmailModalOpen && (
        <ResendVerifyEmailModal
          email={formWatcher.email as string}
          open={resendVerifyEmailModalOpen}
          onClose={() => setResendVerifyEmailModalOpen(false)}
        />
      )}
      <Card className="mx-auto w-full max-w-lg p-6 max-md:max-w-md max-md:px-0">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold">
            {t('auth.login.title')}
          </CardTitle>
          <CardDescription>{t('auth.login.description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {formError && (
            <Alert className="mb-6" variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{t('general.error')}</AlertTitle>
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          <Form {...form}>
            <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('general.email')}</FormLabel>
                    <FormControl>
                      <Input placeholder="support@lukittu.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center">
                      <FormLabel htmlFor="password">
                        {t('general.password')}
                      </FormLabel>
                      <Link
                        className="ml-auto inline-block text-sm underline"
                        href="/auth/forgot-password"
                      >
                        {t('auth.login.forgot_password')}
                      </Link>
                    </div>
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
              <FormField
                control={form.control}
                name="rememberMe"
                render={({ field }) => (
                  <FormItem className="flex items-center gap-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <FormLabel>{t('auth.login.stay_signed_in')}</FormLabel>
                  </FormItem>
                )}
              />
              <SubmitButton label={t('general.login')} pending={pending} />
              <div className="space-y-4">
                <div className="flex w-full items-center gap-4">
                  <Separator className="w-auto flex-grow" />
                  <span className="text-sm">
                    {t('general.or').toUpperCase()}
                  </span>
                  <Separator className="w-auto flex-grow" />
                </div>
                <LoginWithGoogleButton />
              </div>
            </form>
          </Form>
        </CardContent>
        <CardFooter>
          <p className="text-sm">
            {t('auth.login.new_to_app')}{' '}
            <Link className="font-semibold text-primary" href="/auth/register">
              {t('auth.login.create_account')}
            </Link>
          </p>
        </CardFooter>
      </Card>
    </>
  );
}
