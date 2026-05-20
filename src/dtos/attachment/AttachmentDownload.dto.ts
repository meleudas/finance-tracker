import { z } from "zod";
import { env } from "../../config/env";
import { AttachmentResponseSchema } from "./AttachmentResponse.dto";

export const attachmentDownloadUrlQuerySchema = z
  .object({
    expiresInSeconds: z.coerce
      .number()
      .int()
      .min(60)
      .max(env.ATTACHMENT_PRESIGNED_URL_MAX_EXPIRY_SECONDS)
      .optional(),
  })
  .strict();

export type AttachmentDownloadUrlQueryDto = z.infer<typeof attachmentDownloadUrlQuerySchema>;

export const attachmentDownloadUrlResponseSchema = z
  .object({
    downloadUrl: z.url(),
    expiresInSeconds: z.number().int().positive(),
  })
  .strict();

export type AttachmentDownloadUrlResponseDto = z.infer<typeof attachmentDownloadUrlResponseSchema>;

export const attachmentWithDownloadUrlResponseSchema = AttachmentResponseSchema.extend({
  downloadUrl: z.url(),
  expiresInSeconds: z.number().int().positive(),
}).strict();

export type AttachmentWithDownloadUrlResponseDto = z.infer<
  typeof attachmentWithDownloadUrlResponseSchema
>;
