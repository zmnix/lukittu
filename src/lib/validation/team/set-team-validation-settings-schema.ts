import { getTranslations } from 'next-intl/server';
import { z } from 'zod';

export type SetTeamValidationSettingsSchema = z.infer<
  ReturnType<typeof setTeamValidationSettingsSchema>
>;

export const setTeamValidationSettingsSchema = (
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
    })
    .strict();
