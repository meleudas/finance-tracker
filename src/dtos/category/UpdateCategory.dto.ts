import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { isNonEmptyPatch, nonEmptyPatchRefineConfig } from "../common/schemas";

export const UpdateCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    parentId: cuidSchema.nullable().optional(),
  })
  .strict()
  .refine(isNonEmptyPatch, nonEmptyPatchRefineConfig);

export type UpdateCategoryDto = z.infer<typeof UpdateCategorySchema>;
