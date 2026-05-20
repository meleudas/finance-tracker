// src/validators/category/category.response.schema.ts
import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { isoDatetimeSchema, transactionDirectionSchema } from "../common/schemas";

export const CategoryResponseSchema = z
  .object({
    id: cuidSchema,
    name: z.string(),
    kind: transactionDirectionSchema,
    parentId: cuidSchema.nullable(),
    createdAt: isoDatetimeSchema,
    updatedAt: isoDatetimeSchema,
    deletedAt: isoDatetimeSchema.nullable(),
    isDeleted: z.boolean(),
  })
  .strict();

export type CategoryResponseDto = z.infer<typeof CategoryResponseSchema>;