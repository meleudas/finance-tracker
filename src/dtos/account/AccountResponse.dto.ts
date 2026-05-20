import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { isoDatetimeSchema } from "../common/schemas";

export const AccountResponseSchema = z.object({
  id: cuidSchema,
  userId: cuidSchema,
  currencyId: cuidSchema,
  name: z.string(),
  createdAt: isoDatetimeSchema,
  updatedAt: isoDatetimeSchema,
  isDeleted: z.boolean(),
});

export type AccountResponseDto = z.infer<typeof AccountResponseSchema>;
