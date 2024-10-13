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
      ipLimitPeriod: z.enum(['DAY', 'WEEK', 'MONTH']),
      heartbeatTimeout: z
        .number()
        .positive({ message: t('validation.heartbeat_timeout_positive') })
        .int(),
      emailMessage: z.string().max(1000).optional(),
    })
    .strict();
