import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type SetProductSchema = z.infer<ReturnType<typeof setProductSchema>>;

export const setProductSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      id: z.number().positive().optional(),
      name: z
        .string({
          required_error: t('validation.product_name_required'),
        })
        .min(3, {
          message: t('validation.product_name_min_length'),
        })
        .max(255, {
          message: t('validation.product_name_max_length'),
        })
        .regex(/^[a-zA-Z0-9\s\-_]+$/, {
          message: t('validation.product_name_invalid'), // Team name can only contain letters, numbers, spaces, and the following characters: - _
        }),
      description: z
        .string()
        .max(500, {
          message: t('validation.product_description_max_length'),
        })
        .optional(),
      url: z.union([
        z.string().url({
          message: t('validation.product_url_invalid'),
        }),
        z.literal(''),
      ]),
    })
    .strict();
