import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type ResetPasswordSchema = z.infer<
  ReturnType<typeof resetPasswordSchema>
>;

export const resetPasswordSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      password: z
        .string({ message: t('validation.password_required') })
        .min(6, {
          message: t('validation.password_min_length'),
        }),
      passwordConfirmation: z
        .string({
          required_error: t('validation.password_confirmation_required'),
        })
        .min(6, {
          message: t('validation.password_min_length'),
        }),
    })
    .refine((data) => data.password === data.passwordConfirmation, {
      message: t('validation.password_mismatch'),
      path: ['passwordConfirmation'],
    });
