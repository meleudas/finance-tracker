import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { isoDatetimeSchema } from "../common/schemas";

export const AttachmentResponseSchema = z
  .object({
    id: cuidSchema,
    transactionId: cuidSchema,
    storageKey: z.string(),
    mimeType: z.string(),
    originalName: z.string(),
    createdAt: isoDatetimeSchema,
    updatedAt: isoDatetimeSchema,
    deletedAt: isoDatetimeSchema.nullable(),
    isDeleted: z.boolean(),
  })
  .strict();

export type AttachmentResponseDto = z.infer<typeof AttachmentResponseSchema>;
