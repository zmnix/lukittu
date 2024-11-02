import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type SetLatestReleaseSchema = z.infer<
  ReturnType<typeof setLatestReleaseSchema>
>;

export const setLatestReleaseSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      releaseId: z
        .string({
          message: t('validation.release_product_required'),
        })
        .uuid({
          message: t('validation.release_product_required'),
        }),
    })
    .strict();
