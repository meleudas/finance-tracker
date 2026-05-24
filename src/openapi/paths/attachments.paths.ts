import { API_V1_PREFIX } from "../constants";
import {
  appendCsrfParameters,
  errorResponses,
  mutationErrorResponses,
  protectedMutationSecurity,
  protectedSecurity,
} from "../helpers";
import { openApiRegistry } from "../registry";
import {
  AttachmentDownloadUrlEnvelopeSchema,
  AttachmentDownloadUrlQuerySchema,
  AttachmentIdParamsSchema,
  AttachmentResponseEnvelopeSchema,
  AttachmentWithDownloadUrlEnvelopeSchema,
  AttachmentWithDownloadUrlListEnvelopeSchema,
  ConfirmPresignedUploadBodySchema,
  DeleteResponseEnvelopeSchema,
  PresignedUploadCompleteEnvelopeSchema,
  PresignedUploadMultipartSchema,
  PresignedUploadUrlEnvelopeSchema,
  PresignedUploadUrlRequestSchema,
  TransactionIdParamsSchema,
  UpdateAttachmentBodySchema,
  UploadAttachmentMultipartSchema,
} from "../schemas/components";

const tag = "Attachments";
const basePath = `${API_V1_PREFIX}/transactions/{transactionId}/attachments`;

const presignedUploadFlowDescription =
  "Presigned upload flow (all 3 steps available in Swagger):\n\n" +
  "1. **POST .../presigned-upload-url** — returns `data.storageKey` and optional `data.uploadUrl`.\n" +
  "2. **PUT .../presigned-upload** — multipart: `storageKey` (from step 1) + `file` (+ optional `mimeType`). Uploads bytes to MinIO via API.\n" +
  "   Alternative for curl only: **PUT `data.uploadUrl`** directly to MinIO with `Content-Type: mimeType`.\n" +
  "3. **POST .../confirm** — same `storageKey`, `originalName`, and `mimeType` as step 1.\n\n" +
  "Before mutating calls with cookie auth: **GET /api/v1/auth/csrf** and header `x-csrf-token`.\n\n" +
  "Download URLs use `S3_PUBLIC_ENDPOINT` when set (Docker: `http://localhost:9000`).";

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List attachments for a transaction",
  description:
    "Each item includes a presigned `downloadUrl`. Optional query `expiresInSeconds` (60–3600) controls link TTL.",
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
  summary: "Upload attachment (multipart)",
  description:
    "Single-step upload via multipart form. Field name for the file must be `file`. Optional fields `originalName` and `mimeType` override detected values.",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    params: TransactionIdParamsSchema,
    body: {
      required: true,
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
    ...mutationErrorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: `${basePath}/presigned-upload-url`,
  tags: [tag],
  summary: "Presigned upload — step 1 of 3",
  description: presignedUploadFlowDescription,
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    params: TransactionIdParamsSchema,
    body: {
      required: true,
      content: { "application/json": { schema: PresignedUploadUrlRequestSchema } },
    },
  },
  responses: {
    201: {
      description:
        "Presigned upload URL and storageKey for step 2 (PUT presigned-upload or MinIO) and step 3 (confirm)",
      content: { "application/json": { schema: PresignedUploadUrlEnvelopeSchema } },
    },
    ...mutationErrorResponses,
  },
});

openApiRegistry.registerPath({
  method: "put",
  path: `${basePath}/presigned-upload`,
  tags: [tag],
  summary: "Presigned upload — step 2 of 3 (upload file)",
  description:
    "Uploads file bytes to object storage for the `storageKey` returned in step 1. " +
    "Use the same `mimeType` as in step 1 when confirming in step 3.",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    params: TransactionIdParamsSchema,
    body: {
      required: true,
      content: {
        "multipart/form-data": {
          schema: PresignedUploadMultipartSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "File stored at the given storageKey; proceed to step 3 confirm",
      content: { "application/json": { schema: PresignedUploadCompleteEnvelopeSchema } },
    },
    ...mutationErrorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: `${basePath}/confirm`,
  tags: [tag],
  summary: "Presigned upload — step 3 of 3 (confirm)",
  description:
    "Registers attachment metadata after step 2. " +
    "`storageKey` must match step 1; `originalName` and `mimeType` must match step 1 as well.",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    params: TransactionIdParamsSchema,
    body: {
      required: true,
      content: { "application/json": { schema: ConfirmPresignedUploadBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Attachment metadata stored",
      content: { "application/json": { schema: AttachmentResponseEnvelopeSchema } },
    },
    ...mutationErrorResponses,
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
  description:
    "Returns only `downloadUrl` and `expiresInSeconds`. Open the URL in a browser or curl; requires the object to exist in MinIO.",
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
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    params: AttachmentIdParamsSchema,
    body: { content: { "application/json": { schema: UpdateAttachmentBodySchema } } },
  },
  responses: {
    200: {
      description: "Updated attachment",
      content: { "application/json": { schema: AttachmentResponseEnvelopeSchema } },
    },
    ...mutationErrorResponses,
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Delete attachment",
  description: "Soft-deletes metadata and removes the file from object storage.",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: { params: AttachmentIdParamsSchema },
  responses: {
    200: {
      description: "Soft-deleted attachment",
      content: { "application/json": { schema: DeleteResponseEnvelopeSchema } },
    },
    ...mutationErrorResponses,
  },
});
