import { z } from "zod";
import { isNonEmptyPatch, nonEmptyPatchRefineConfig } from "../common/schemas";

export const UpdateAttachmentSchema = z
  .object({
    originalName: z.string().trim().min(1).max(255).optional(),
  })
  .strict()
  .refine(isNonEmptyPatch, nonEmptyPatchRefineConfig);

export type UpdateAttachmentDto = z.infer<typeof UpdateAttachmentSchema>;
