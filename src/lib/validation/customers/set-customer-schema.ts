import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { metadataSchema } from '../shared/metadata-schema';

export type SetCustomerSchema = z.infer<ReturnType<typeof setCustomerSchema>>;

export const setCustomerSchema = (
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
        })
        .nullable(),
      fullName: z
        .string({
          required_error: t('validation.full_name_required'),
        })
        .min(3, {
          message: t('validation.full_name_min_length'),
        })
        .max(255, {
          message: t('validation.full_name_max_length'),
        })
        .nullable(),
      metadata: metadataSchema(t),
    })
    .strict()
    .refine(
      (data) => {
        if (!data.email && !data.fullName) {
          return false;
        }
        return true;
      },
      {
        message: t('validation.email_or_full_name_required'),
        path: ['email'],
      },
    );
