import { iso3ToName } from '@/lib/constants/country-alpha-3-to-name';
import { BlacklistType } from '@prisma/client';
import { getTranslations } from 'next-intl/server';
import { z } from 'zod';
import { metadataSchema } from '../shared/metadata-schema';

export type SetBlacklistSchema = z.infer<ReturnType<typeof setBlacklistSchema>>;

export const setBlacklistSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      type: z.enum(['COUNTRY', 'IP_ADDRESS', 'DEVICE_IDENTIFIER']),
      value: z
        .string({
          required_error: t('validation.blacklist_value_required'),
        })
        .min(3, {
          message: t('validation.blacklist_value_min_length'),
        })
        .max(1000, {
          message: t('validation.blacklist_value_max_length'),
        }),
      metadata: metadataSchema(t),
    })
    .strict()
    .refine(
      (data) => {
        const countries = Object.keys(iso3ToName);
        if (data.type === 'COUNTRY' && !countries.includes(data.value)) {
          return false;
        }
        return true;
      },
      {
        message: t('validation.invalid_country'),
        path: ['value'],
      },
    )
    .refine(
      (data) => {
        if (data.type === BlacklistType.IP_ADDRESS) {
          const zodSchema = z.string().ip();
          return zodSchema.safeParse(data.value).success;
        }

        return true;
      },
      {
        message: t('validation.invalid_ip'),
        path: ['value'],
      },
    );
