import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type ForgotPasswordSchema = z.infer<
  ReturnType<typeof forgotPasswordSchema>
>;

export const forgotPasswordSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      email: z
        .string({
          required_error: t('validation.email_required'),
        })
        .email({
          message: t('validation.invalid_email'),
        }),
    })
    .strict();
