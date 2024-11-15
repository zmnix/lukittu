import { regex } from '@/lib/constants/regex';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { metadataSchema } from '../shared/metadata-schema';

export type SetLicenseScheama = z.infer<ReturnType<typeof setLicenseSchema>>;

export const setLicenseSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      licenseKey: z.string().regex(regex.licenseKey, {
        message: t('validation.license_key_invalid'),
      }),
      expirationType: z.enum(['DATE', 'DURATION', 'NEVER']),
      expirationStart: z.enum(['CREATION', 'ACTIVATION']).nullable(),
      expirationDate: z.coerce.date().nullable(),
      expirationDays: z.number().positive().min(1).int().nullable(),
      seats: z.number().min(1).positive().int().nullable(),
      suspended: z.boolean(),
      productIds: z.array(z.string().uuid()),
      customerIds: z.array(z.string().uuid()),
      ipLimit: z.number().positive().int().nullable(),
      metadata: metadataSchema(t),
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
