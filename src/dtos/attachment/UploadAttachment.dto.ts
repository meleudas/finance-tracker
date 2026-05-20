import { z } from "zod";
import { env } from "../../config/env";

export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_ATTACHMENT_SIZE_BYTES = env.ATTACHMENT_MAX_SIZE_BYTES;

export const attachmentMimeTypeSchema = z.enum(ALLOWED_ATTACHMENT_MIME_TYPES);

export const uploadAttachmentSchema = z
  .object({
    originalName: z.string().trim().min(1).max(255),
    mimeType: attachmentMimeTypeSchema,
  })
  .strict();

export type UploadAttachmentDto = z.infer<typeof uploadAttachmentSchema>;

/** File bytes come from multipart parser, not JSON body. */
export interface UploadAttachmentInput extends UploadAttachmentDto {
  buffer: Buffer;
}
