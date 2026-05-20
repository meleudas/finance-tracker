import { z } from "zod";

export const UserResponseSchema = z.object({
  id: z.cuid2(),
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  email: z.string().email(),
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  createdAt: z.string().datetime(),
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  updatedAt: z.string().datetime(),
});

export type UserResponse = z.infer<typeof UserResponseSchema>;
