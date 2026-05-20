import { z } from "zod";
import { attachmentIdParamSchema, transactionIdParamSchema } from "../dtos/common/id.dto";
import { UpdateAttachmentSchema } from "../dtos/attachment/UpdateAttachment.dto";
import { attachmentDownloadUrlQuerySchema } from "../dtos/attachment/AttachmentDownload.dto";
import { presignedUploadUrlRequestSchema } from "../dtos/attachment/PresignedUploadUrl.dto";

/** GET /transactions/:transactionId/attachments */
export const ListAttachmentsRequestValidator = z.object({
  params: transactionIdParamSchema,
  query: attachmentDownloadUrlQuerySchema.optional(),
});

/** GET /transactions/:transactionId/attachments/:id */
export const GetAttachmentRequestValidator = z.object({
  params: attachmentIdParamSchema,
  query: attachmentDownloadUrlQuerySchema.optional(),
});

/** GET /transactions/:transactionId/attachments/:id/download-url */
export const GetAttachmentDownloadUrlRequestValidator = z.object({
  params: attachmentIdParamSchema,
  query: attachmentDownloadUrlQuerySchema.optional(),
});

/** POST /transactions/:transactionId/attachments (multipart — file + metadata in controller) */
export const UploadAttachmentParamsValidator = z.object({
  params: transactionIdParamSchema,
});

/** POST /transactions/:transactionId/attachments/presigned-upload-url */
export const PresignedUploadUrlRequestValidator = z.object({
  params: transactionIdParamSchema,
  body: presignedUploadUrlRequestSchema,
});

/** PATCH /transactions/:transactionId/attachments/:id */
export const UpdateAttachmentRequestValidator = z.object({
  params: attachmentIdParamSchema,
  body: UpdateAttachmentSchema,
});

/** DELETE /transactions/:transactionId/attachments/:id */
export const DeleteAttachmentRequestValidator = z.object({
  params: attachmentIdParamSchema,
});

export const CreateAttachmentRequestValidator = UploadAttachmentParamsValidator;
