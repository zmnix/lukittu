import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type SetLicenseScheama = z.infer<ReturnType<typeof setLicenseSchema>>;

export const setLicenseSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      licenseKey: z
        .string()
        .regex(
          /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/,
          {
            message: t('validation.license_key_invalid'),
          },
        ),
      expirationType: z.enum(['DATE', 'DURATION', 'NEVER']),
      expirationStart: z.enum(['CREATION', 'ACTIVATION']).nullable(),
      expirationDate: z.coerce.date().nullable(),
      expirationDays: z.number().positive().nullable(),
      suspended: z.boolean(),
      productIds: z.array(z.string().uuid()),
      customerIds: z.array(z.string().uuid()),
      ipLimit: z.number().positive().nullable(),
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
        if (data.expirationType === 'DURATION') {
          return !!data.expirationStart && !!data.expirationDays;
        }
        return true;
      },
      {
        path: ['expirationDays'],
        message: t('validation.expiration_days_required'),
      },
    )
    .refine(
      (data) => {
        if (data.expirationType === 'DATE') {
          return !!data.expirationDate && data.expirationDate > new Date();
        }

        return true;
      },
      {
        message: t('validation.expiration_date_required'),
        path: ['expirationDate'],
      },
    )
    .refine((data) => {
      if (data.expirationType === 'NEVER') {
        return (
          !data.expirationStart && !data.expirationDate && !data.expirationDays
        );
      }

      return true;
    });
