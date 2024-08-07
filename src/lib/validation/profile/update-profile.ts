import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type UpdateProfileSchema = z.infer<
  ReturnType<typeof updateProfileSchema>
>;

export const updateProfileSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      fullName: z
        .string({
          required_error: t('validation.full_name_required'),
        })
        .min(3, {
          message: t('validation.full_name_min_length'),
        })
        .max(255, {
          message: t('validation.full_name_max_length'),
        }),
    })
    .strict();
