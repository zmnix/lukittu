import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type SetTeamEmailSettingsSchema = z.infer<
  ReturnType<typeof setTeamEmailSettingsSchema>
>;

export const setTeamEmailSettingsSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      emailMessage: z.string().max(1000).optional(),
    })
    .strict();
