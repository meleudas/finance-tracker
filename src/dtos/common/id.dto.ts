import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-deprecated -- matches Prisma cuid() v1
export const cuidSchema = z.cuid("Invalid cuid");

export const idDtoSchema = z.object({
  id: cuidSchema,
});

export type IdDto = z.infer<typeof idDtoSchema>;

export const transactionIdParamSchema = z.object({
  transactionId: cuidSchema,
});

export type TransactionIdParamDto = z.infer<typeof transactionIdParamSchema>;

export const attachmentIdParamSchema = z.object({
  transactionId: cuidSchema,
  id: cuidSchema,
});

export type AttachmentIdParamDto = z.infer<typeof attachmentIdParamSchema>;
