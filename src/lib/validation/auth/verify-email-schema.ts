import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type VerifyEmailSchema = z.infer<ReturnType<typeof verifyEmaiLSchema>>;

export const verifyEmaiLSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      token: z.string({
        required_error: t('validation.token_required'),
      }),
    })
    .strict();
