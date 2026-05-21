import { API_V1_PREFIX } from "../constants";
import { errorResponses, protectedSecurity } from "../helpers";
import { openApiRegistry } from "../registry";
import {
  AttachmentDownloadUrlEnvelopeSchema,
  AttachmentDownloadUrlQuerySchema,
  AttachmentIdParamsSchema,
  AttachmentResponseEnvelopeSchema,
  AttachmentWithDownloadUrlEnvelopeSchema,
  AttachmentWithDownloadUrlListEnvelopeSchema,
  DeleteResponseEnvelopeSchema,
  ConfirmPresignedUploadBodySchema,
  PresignedUploadUrlEnvelopeSchema,
  PresignedUploadUrlRequestSchema,
  TransactionIdParamsSchema,
  UpdateAttachmentBodySchema,
  UploadAttachmentMultipartSchema,
} from "../schemas/components";

const tag = "Attachments";
const basePath = `${API_V1_PREFIX}/transactions/{transactionId}/attachments`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List attachments for a transaction",
  security: protectedSecurity,
  request: {
    params: TransactionIdParamsSchema,
    query: AttachmentDownloadUrlQuerySchema,
  },
  responses: {
    200: {
      description: "Attachments with presigned download URLs",
      content: { "application/json": { schema: AttachmentWithDownloadUrlListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: basePath,
  tags: [tag],
  summary: "Upload attachment",
  description: "Uploads a file via multipart form. Field name for the file must be `file`.",
  security: protectedSecurity,
  request: {
    params: TransactionIdParamsSchema,
    body: {
      content: {
        "multipart/form-data": {
          schema: UploadAttachmentMultipartSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Attachment metadata stored",
      content: { "application/json": { schema: AttachmentResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: `${basePath}/presigned-upload-url`,
  tags: [tag],
  summary: "Get presigned upload URL (step 1 of 2)",
  description:
    "Returns a short-lived URL and storageKey for direct PUT upload to object storage. After uploading the file to S3, call POST .../confirm with the same storageKey and file metadata.",
  security: protectedSecurity,
  request: {
    params: TransactionIdParamsSchema,
    body: {
      content: { "application/json": { schema: PresignedUploadUrlRequestSchema } },
    },
  },
  responses: {
    201: {
      description: "Presigned upload URL",
      content: { "application/json": { schema: PresignedUploadUrlEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: `${basePath}/confirm`,
  tags: [tag],
  summary: "Confirm presigned upload (step 2 of 2)",
  description:
    "Registers attachment metadata in the database after the client has uploaded the file via the presigned PUT URL.",
  security: protectedSecurity,
  request: {
    params: TransactionIdParamsSchema,
    body: {
      content: { "application/json": { schema: ConfirmPresignedUploadBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Attachment metadata stored",
      content: { "application/json": { schema: AttachmentResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Get attachment with download URL",
  security: protectedSecurity,
  request: {
    params: AttachmentIdParamsSchema,
    query: AttachmentDownloadUrlQuerySchema,
  },
  responses: {
    200: {
      description: "Attachment with presigned download URL",
      content: { "application/json": { schema: AttachmentWithDownloadUrlEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}/download-url`,
  tags: [tag],
  summary: "Get attachment download URL",
  security: protectedSecurity,
  request: {
    params: AttachmentIdParamsSchema,
    query: AttachmentDownloadUrlQuerySchema,
  },
  responses: {
    200: {
      description: "Presigned download URL",
      content: { "application/json": { schema: AttachmentDownloadUrlEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "patch",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Update attachment metadata",
  security: protectedSecurity,
  request: {
    params: AttachmentIdParamsSchema,
    body: { content: { "application/json": { schema: UpdateAttachmentBodySchema } } },
  },
  responses: {
    200: {
      description: "Updated attachment",
      content: { "application/json": { schema: AttachmentResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Delete attachment",
  description: "Soft-deletes metadata and removes the file from object storage.",
  security: protectedSecurity,
  request: { params: AttachmentIdParamsSchema },
  responses: {
    200: {
      description: "Soft-deleted attachment",
      content: { "application/json": { schema: DeleteResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});
