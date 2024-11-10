import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type CreateApiKeySchema = z.infer<ReturnType<typeof createApiKeySchema>>;

export const createApiKeySchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      expiresAt: z.coerce.date().nullable(),
    })
    .strict();
