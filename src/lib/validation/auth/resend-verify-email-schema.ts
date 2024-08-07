import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type ResendVerifyEmailSchema = z.infer<
  ReturnType<typeof resendVerifyEmailSchema>
>;

export const resendVerifyEmailSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z.object({
    email: z
      .string({
        required_error: t('validation.email_required'),
      })
      .email({
        message: t('validation.invalid_email'),
      }),
  });
