import { z } from 'zod';

export type LicenseHeartbeatSchema = z.infer<
  ReturnType<typeof licenseHeartbeatSchema>
>;

export const licenseHeartbeatSchema = () =>
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
      clientIdentifier: z
        .string({
          message: 'Client identifier must be a string',
        })
        .min(10, {
          message: 'Client identifier must be at least 10 characters',
        })
        .max(1000, {
          message: 'Client identifier must be less than 1000 characters',
        }),
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
      challenge: z
        .string({ message: 'Challenge must be a string' })
        .max(1000, { message: 'Challenge must be less than 1000 characters' })
        .optional(),
    })
    .strict({ message: 'Invalid payload' });
