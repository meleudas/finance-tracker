import { z } from "zod";
import { uploadAttachmentSchema } from "./UploadAttachment.dto";

export const confirmPresignedUploadSchema = uploadAttachmentSchema
  .extend({
    storageKey: z.string().trim().min(1).max(500),
  })
  .strict();

export type ConfirmPresignedUploadDto = z.infer<typeof confirmPresignedUploadSchema>;
