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
      expirationDate: z.date().nullable(),
      expirationDays: z.number().positive().nullable(),
      suspended: z.boolean(),
      productIds: z.array(z.number().positive()),
      customerIds: z.array(z.number().positive()),
      ipLimit: z.number().positive().nullable(),
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
