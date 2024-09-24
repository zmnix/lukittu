import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type InviteMemberSchema = z.infer<ReturnType<typeof inviteMemberSchema>>;

export const inviteMemberSchema = (
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
