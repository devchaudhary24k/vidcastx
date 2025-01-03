import { z } from 'zod';

export const CreateOrganizationSchema = z.object({
  name: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(1)
    .regex(/^[a-zA-Z0-9-]+$/, {
      message: 'Slug must be one word without spaces',
    }),
});
