import { z } from "zod";

export const UpdateAccountSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
  })
  .strict();

export type UpdateAccountDto = z.infer<typeof UpdateAccountSchema>;
