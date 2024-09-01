import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type SetCustomerSchema = z.infer<ReturnType<typeof setCustomerSchema>>;

export const setCustomerSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      id: z.string().uuid().optional(),
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
