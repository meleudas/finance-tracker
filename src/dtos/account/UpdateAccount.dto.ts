import { z } from "zod";
import { optionalNoteSchema } from "../common/schemas";

export const UpdateAccountSchema = z
  .object({
    name: z.string().min(1).max(100).optional(),
    note: optionalNoteSchema,
  })
  .strict();

export type UpdateAccountDto = z.infer<typeof UpdateAccountSchema>;
