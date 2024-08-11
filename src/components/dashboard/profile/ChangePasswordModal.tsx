'use client';
import changePassword from '@/actions/profile/change-password';
import LoadingButton from '@/components/shared/LoadingButton';
import PasswordIndicator from '@/components/shared/PasswordIndicator';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
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
  onClose: () => void;
}

export default function ChangePasswordModal({
  open,
  onClose,
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

  const onSubmit = (data: ChangePasswordSchema) => {
    startTransition(async () => {
      const res = await changePassword(data);
      if (res.isError) {
        if (res.field) {
          return form.setError(res.field as keyof ChangePasswordSchema, {
            type: 'manual',
            message: res.message,
          });
        }
      }

      if (!res.isError) {
        form.reset();
        onClose();
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{t('dashboard.profile.change_password')}</DialogTitle>
        </DialogHeader>
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
        <DialogFooter>
          <LoadingButton type="submit" variant="outline" onClick={onClose}>
            {t('general.close')}
          </LoadingButton>
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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
