import { z } from "zod";

export const presignedUploadBodySchema = z.object({
  storageKey: z.string().trim().min(1).max(500),
});

export type PresignedUploadBodyDto = z.infer<typeof presignedUploadBodySchema>;

export const presignedUploadCompleteResponseSchema = z
  .object({
    storageKey: z.string().trim().min(1).max(500),
  })
  .strict();

export type PresignedUploadCompleteResponseDto = z.infer<
  typeof presignedUploadCompleteResponseSchema
>;
