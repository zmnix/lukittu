import { z } from 'zod';

export type VerifyLicenseSchema = z.infer<
  ReturnType<typeof verifyLicenseSchema>
>;

export const verifyLicenseSchema = () =>
  z
    .object({
      licenseKey: z
        .string()
        .regex(/^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/),
    })
    .strict();
