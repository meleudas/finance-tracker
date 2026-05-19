// dtos/common/delete-response.dto.ts
import { z } from "zod";
import { cuidSchema } from "./id.dto";
import { isoDatetimeSchema } from "./schemas";

export const deleteResponseSchema = z
  .object({
    id: cuidSchema,
    deletedAt: isoDatetimeSchema,
    isDeleted: z.literal(true),
  })
  .strict();

export type DeleteResponseDto = z.infer<typeof deleteResponseSchema>;
