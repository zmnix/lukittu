import { z } from 'zod';

export type VerifyLicenseSchema = z.infer<
  ReturnType<typeof verifyLicenseSchema>
>;

export const verifyLicenseSchema = () =>
  z
    .object({
      licenseKey: z
        .string({ message: 'License key must be a string' })
        .regex(
          /^[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}-[A-Z0-9]{5}$/,
          {
            message:
              'License key must be in the format of XXXXX-XXXXX-XXXXX-XXXXX-XXXXX',
          },
        ),
      customerId: z
        .string({ message: 'Customer UUID must be a string' })
        .uuid({
          message: 'Customer UUID must be a valid UUID',
        })
        .optional(),
      productId: z
        .string({ message: 'Product UUID must be a string' })
        .uuid({
          message: 'Product UUID must be a valid UUID',
        })
        .optional(),
      challenge: z.string({ message: 'Challenge must be a string' }).optional(),
    })
    .strict({ message: 'Invalid payload' });
