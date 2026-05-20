import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { optionalNoteSchema } from "../common/schemas";

export const CreateAccountSchema = z
  .object({
    name: z.string().min(1).max(100),
    currencyId: cuidSchema,
    note: optionalNoteSchema,
  })
  .strict();

export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;
