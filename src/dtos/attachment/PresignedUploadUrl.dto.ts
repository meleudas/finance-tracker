import { z } from "zod";
import { uploadAttachmentSchema } from "./UploadAttachment.dto";

export const presignedUploadUrlRequestSchema = uploadAttachmentSchema;

export type PresignedUploadUrlRequestDto = z.infer<typeof presignedUploadUrlRequestSchema>;

export const presignedUploadUrlResponseSchema = z
  .object({
    storageKey: z.string().trim().min(1).max(500),
    uploadUrl: z.url(),
    expiresInSeconds: z.number().int().positive(),
  })
  .strict();

export type PresignedUploadUrlResponseDto = z.infer<typeof presignedUploadUrlResponseSchema>;
