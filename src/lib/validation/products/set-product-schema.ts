import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type SetProductSchema = z.infer<ReturnType<typeof setProductSchema>>;

export const setProductSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      id: z.string().uuid().optional(),
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
      url: z.union([
        z.string().url({
          message: t('validation.product_url_invalid'),
        }),
        z.literal(''),
      ]),
      metadata: z.array(
        z.object({
          key: z
            .string()
            .min(1, {
              message: t('validation.metadata_key_min_length'),
            })
            .max(255, {
              message: t('validation.metadata_key_max_length'),
            }),
          value: z
            .string()
            .min(1, {
              message: t('validation.metadata_value_min_length'),
            })
            .max(255, {
              message: t('validation.metadata_value_max_length'),
            }),
        }),
      ),
    })
    .strict();
