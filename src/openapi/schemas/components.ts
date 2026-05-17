import { CreateTransactionSchema } from "../../dtos/transaction/CreateTransaction.dto";
import { UpdateTransactionSchema } from "../../dtos/transaction/UpdateTransaction.dto";
import { TransactionResponseSchema } from "../../dtos/transaction/TransactionResponse.dto";
import { transactionListQuerySchema } from "../../dtos/transaction/TransactionListQuery.dto";
import { CreateTransferSchema } from "../../dtos/transfer/CreateTransfer.dto";
import { UpdateTransferSchema } from "../../dtos/transfer/UpdateTransfer.dto";
import { TransferResponseSchema } from "../../dtos/transfer/TransferResponse.dto";
import { transferListQuerySchema } from "../../dtos/transfer/TransferListQuery.dto";
import { AttachmentResponseSchema } from "../../dtos/attachment/AttachmentResponse.dto";
import { UpdateAttachmentSchema } from "../../dtos/attachment/UpdateAttachment.dto";
import {
  attachmentDownloadUrlQuerySchema,
  attachmentDownloadUrlResponseSchema,
  attachmentWithDownloadUrlResponseSchema,
} from "../../dtos/attachment/AttachmentDownload.dto";
import {
  presignedUploadUrlRequestSchema,
  presignedUploadUrlResponseSchema,
} from "../../dtos/attachment/PresignedUploadUrl.dto";
import { uploadAttachmentSchema } from "../../dtos/attachment/UploadAttachment.dto";
import { deleteResponseSchema } from "../../dtos/common/DeleteResponse.dto";
import {
  attachmentIdParamSchema,
  idDtoSchema,
  transactionIdParamSchema,
} from "../../dtos/common/id.dto";
import { z } from "../zod";
import { openApiRegistry } from "../registry";
import { dataEnvelopeSchema, paginatedEnvelopeSchema } from "./envelope";

export const IdParamsSchema = openApiRegistry.register("IdParams", idDtoSchema);
export const TransactionIdParamsSchema = openApiRegistry.register(
  "TransactionIdParams",
  transactionIdParamSchema,
);
export const AttachmentIdParamsSchema = openApiRegistry.register(
  "AttachmentIdParams",
  attachmentIdParamSchema,
);

export const AccountIdParamsSchema = openApiRegistry.register(
  "AccountIdParams",
  z.object({ accountId: idDtoSchema.shape.id }),
);

export const CategoryIdParamsSchema = openApiRegistry.register(
  "CategoryIdParams",
  z.object({ categoryId: idDtoSchema.shape.id }),
);

export const CreateTransactionBodySchema = openApiRegistry.register(
  "CreateTransaction",
  CreateTransactionSchema,
);
export const UpdateTransactionBodySchema = openApiRegistry.register(
  "UpdateTransaction",
  UpdateTransactionSchema,
);
export const TransactionResponseSchemaRef = openApiRegistry.register(
  "TransactionResponse",
  TransactionResponseSchema,
);
export const TransactionListQuerySchema = openApiRegistry.register(
  "TransactionListQuery",
  transactionListQuerySchema,
);

export const CreateTransferBodySchema = openApiRegistry.register(
  "CreateTransfer",
  CreateTransferSchema,
);
export const UpdateTransferBodySchema = openApiRegistry.register(
  "UpdateTransfer",
  UpdateTransferSchema,
);
export const TransferResponseSchemaRef = openApiRegistry.register(
  "TransferResponse",
  TransferResponseSchema,
);
export const TransferListQuerySchema = openApiRegistry.register(
  "TransferListQuery",
  transferListQuerySchema,
);

export const AttachmentResponseSchemaRef = openApiRegistry.register(
  "AttachmentResponse",
  AttachmentResponseSchema,
);
export const UpdateAttachmentBodySchema = openApiRegistry.register(
  "UpdateAttachment",
  UpdateAttachmentSchema,
);
export const AttachmentDownloadUrlQuerySchema = openApiRegistry.register(
  "AttachmentDownloadUrlQuery",
  attachmentDownloadUrlQuerySchema,
);
export const AttachmentDownloadUrlResponseSchemaRef = openApiRegistry.register(
  "AttachmentDownloadUrlResponse",
  attachmentDownloadUrlResponseSchema,
);
export const AttachmentWithDownloadUrlResponseSchemaRef = openApiRegistry.register(
  "AttachmentWithDownloadUrlResponse",
  attachmentWithDownloadUrlResponseSchema,
);
export const PresignedUploadUrlRequestSchema = openApiRegistry.register(
  "PresignedUploadUrlRequest",
  presignedUploadUrlRequestSchema,
);
export const PresignedUploadUrlResponseSchemaRef = openApiRegistry.register(
  "PresignedUploadUrlResponse",
  presignedUploadUrlResponseSchema,
);
export const UploadAttachmentMetadataSchema = openApiRegistry.register(
  "UploadAttachmentMetadata",
  uploadAttachmentSchema,
);

export const DeleteResponseSchemaRef = openApiRegistry.register(
  "DeleteResponse",
  deleteResponseSchema,
);

export const UploadAttachmentMultipartSchema = openApiRegistry.register(
  "UploadAttachmentMultipart",
  z.object({
    file: z.string().openapi({ type: "string", format: "binary", description: "Attachment file" }),
    originalName: z.string().optional().openapi({
      description: "Override filename; defaults to uploaded file name",
    }),
    mimeType: z
      .enum(["image/jpeg", "image/png", "image/webp", "application/pdf"])
      .optional()
      .openapi({ description: "Override MIME type; defaults to uploaded file type" }),
  }),
);

export const TransactionResponseEnvelopeSchema = dataEnvelopeSchema(
  TransactionResponseSchemaRef,
  "TransactionResponseEnvelope",
);
export const TransactionListEnvelopeSchema = paginatedEnvelopeSchema(
  TransactionResponseSchemaRef,
  "TransactionListEnvelope",
);
export const TransferResponseEnvelopeSchema = dataEnvelopeSchema(
  TransferResponseSchemaRef,
  "TransferResponseEnvelope",
);
export const TransferListEnvelopeSchema = paginatedEnvelopeSchema(
  TransferResponseSchemaRef,
  "TransferListEnvelope",
);
export const AttachmentResponseEnvelopeSchema = dataEnvelopeSchema(
  AttachmentResponseSchemaRef,
  "AttachmentResponseEnvelope",
);
export const AttachmentWithDownloadUrlListEnvelopeSchema = dataEnvelopeSchema(
  z.array(AttachmentWithDownloadUrlResponseSchemaRef),
  "AttachmentWithDownloadUrlListEnvelope",
);
export const AttachmentWithDownloadUrlEnvelopeSchema = dataEnvelopeSchema(
  AttachmentWithDownloadUrlResponseSchemaRef,
  "AttachmentWithDownloadUrlEnvelope",
);
export const AttachmentDownloadUrlEnvelopeSchema = dataEnvelopeSchema(
  AttachmentDownloadUrlResponseSchemaRef,
  "AttachmentDownloadUrlEnvelope",
);
export const PresignedUploadUrlEnvelopeSchema = dataEnvelopeSchema(
  PresignedUploadUrlResponseSchemaRef,
  "PresignedUploadUrlEnvelope",
);
export const DeleteResponseEnvelopeSchema = dataEnvelopeSchema(
  DeleteResponseSchemaRef,
  "DeleteResponseEnvelope",
);
