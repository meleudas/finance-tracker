import type { RequestHandler } from "express";
import { z } from "zod";

import { confirmPresignedUploadSchema } from "../dtos/attachment/ConfirmPresignedUpload.dto";
import { UpdateAttachmentSchema } from "../dtos/attachment/UpdateAttachment.dto";
import { attachmentDownloadUrlQuerySchema } from "../dtos/attachment/AttachmentDownload.dto";
import { presignedUploadUrlRequestSchema } from "../dtos/attachment/PresignedUploadUrl.dto";
import { attachmentIdParamSchema, transactionIdParamSchema } from "../dtos/common/id.dto";

interface ValidationTarget {
  body?: z.ZodType;
  params?: z.ZodType;
  query?: z.ZodType;
}

interface ValidatedRequest {
  validated: Record<string, unknown>;
}

const createRequestValidator = (config: ValidationTarget): RequestHandler => {
  return (req, res, next) => {
    try {
      const validated: Record<string, unknown> = {};
      if (config.body) validated.body = config.body.parse(req.body);
      if (config.params) validated.params = config.params.parse(req.params);
      if (config.query) validated.query = config.query.parse(req.query);

      (req as unknown as ValidatedRequest).validated = validated;
      next();
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          error: "Validation failed",
          details: error.issues,
        });
      } else {
        next(error);
      }
    }
  };
};

export const ListAttachmentsRequestValidator = createRequestValidator({
  params: transactionIdParamSchema,
  query: attachmentDownloadUrlQuerySchema.optional(),
});

export const UploadAttachmentParamsValidator = createRequestValidator({
  params: transactionIdParamSchema,
});

export const PresignedUploadUrlRequestValidator = createRequestValidator({
  params: transactionIdParamSchema,
  body: presignedUploadUrlRequestSchema,
});

export const ConfirmPresignedUploadRequestValidator = createRequestValidator({
  params: transactionIdParamSchema,
  body: confirmPresignedUploadSchema,
});

export const GetAttachmentRequestValidator = createRequestValidator({
  params: attachmentIdParamSchema,
  query: attachmentDownloadUrlQuerySchema.optional(),
});

export const GetAttachmentDownloadUrlRequestValidator = createRequestValidator({
  params: attachmentIdParamSchema,
  query: attachmentDownloadUrlQuerySchema.optional(),
});

export const UpdateAttachmentRequestValidator = createRequestValidator({
  params: attachmentIdParamSchema,
  body: UpdateAttachmentSchema,
});

export const DeleteAttachmentRequestValidator = createRequestValidator({
  params: attachmentIdParamSchema,
});
