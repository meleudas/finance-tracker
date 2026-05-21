import { z } from "zod";
import { cuidSchema } from "../common/id.dto";

export const CreateAccountSchema = z
  .object({
    name: z.string().min(1).max(100),
    currencyId: cuidSchema,
  })
  .strict();

export type CreateAccountDto = z.infer<typeof CreateAccountSchema>;
