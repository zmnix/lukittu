import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type SetTeamSettingsSchema = z.infer<
  ReturnType<typeof setTeamSettingsSchema>
>;

export const setTeamSettingsSchema = (
  t: Awaited<ReturnType<typeof getTranslations<never>>>,
) =>
  z
    .object({
      strictProducts: z.boolean(),
      strictCustomers: z.boolean(),
    })
    .strict();
