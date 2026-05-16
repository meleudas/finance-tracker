import { z } from 'zod';

export const userResponseSchema = z.object({
  id: z.string().check(z.cuid2()),
  email: z.string().check(z.email()),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type UserResponse = z.infer<typeof userResponseSchema>;
