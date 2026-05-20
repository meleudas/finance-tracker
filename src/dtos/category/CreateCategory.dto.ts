// src/validators/category/category.create.schema.ts
import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { transactionDirectionSchema } from "../common/schemas";

export const CreateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100),
    kind: transactionDirectionSchema,
    parentId: cuidSchema.optional(),
  })
  .strict();

export type CreateCategoryDto = z.infer<typeof CreateCategorySchema>;