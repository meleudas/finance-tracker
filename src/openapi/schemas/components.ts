import { z } from "zod";
import { CreateTransactionSchema } from "../../dtos/transaction/CreateTransaction.dto";
import { UpdateTransactionSchema } from "../../dtos/transaction/UpdateTransaction.dto";
import { TransactionResponseSchema } from "../../dtos/transaction/TransactionResponse.dto";
import { transactionListQuerySchema } from "../../dtos/transaction";
import { CreateTransferSchema } from "../../dtos/transfer/CreateTransfer.dto";
import { UpdateTransferSchema } from "../../dtos/transfer/UpdateTransfer.dto";
import { TransferResponseSchema } from "../../dtos/transfer/TransferResponse.dto";
import { transferListQuerySchema } from "../../dtos/transfer/TransferListQuery.dto";
import { AttachmentResponseSchema } from "../../dtos/attachment";
import { UpdateAttachmentSchema } from "../../dtos/attachment";
import {
  attachmentDownloadUrlQuerySchema,
  attachmentDownloadUrlResponseSchema,
  attachmentWithDownloadUrlResponseSchema,
} from "../../dtos/attachment";
import {
  presignedUploadUrlRequestSchema,
  presignedUploadUrlResponseSchema,
} from "../../dtos/attachment";
import { uploadAttachmentSchema } from "../../dtos/attachment";
import { deleteResponseSchema } from "../../dtos/common";
import { attachmentIdParamSchema, idDtoSchema, transactionIdParamSchema } from "../../dtos/common";
import { openApiRegistry } from "../registry";
import { dataEnvelopeSchema, paginatedEnvelopeSchema } from "./envelope";

// === ACCOUNTS IMPORTS ===
import { CreateAccountSchema } from "../../dtos/account/CreateAccount.dto";
import { UpdateAccountSchema } from "../../dtos/account/UpdateAccount.dto";
import { AccountResponseSchema } from "../../dtos/account/AccountResponse.dto";
import { accountListQuerySchema } from "../../dtos/account/AccountListQuery.dto";

// === AUTH IMPORTS ===
import { AuthResponseSchema } from "../../dtos/auth/AuthResponse.dto";
import { AuthTokensSchema } from "../../dtos/auth/AuthTokens.dto";
import { LoginRequestSchema } from "../../dtos/auth/LoginRequest.dto";
import { LoginResponseSchema } from "../../dtos/auth/LoginResponse.dto";
import { RefreshResponseSchema } from "../../dtos/auth/RefreshResponse.dto";
import { RegisterRequestSchema } from "../../dtos/auth/RegisterRequest.dto";
import { UserResponseSchema } from "../../dtos/users/UserResponse.dto";

// === PARAMS SCHEMAS ===
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
  z.object({ id: idDtoSchema.shape.id }),
);
export const CategoryIdParamsSchema = openApiRegistry.register(
  "CategoryIdParams",
  z.object({ categoryId: idDtoSchema.shape.id }),
);

// === TRANSACTIONS ===
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

// === TRANSFERS ===
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

// === ATTACHMENTS ===
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

// === ACCOUNTS ===
export const CreateAccountBodySchema = openApiRegistry.register(
  "CreateAccount",
  CreateAccountSchema,
);
export const UpdateAccountBodySchema = openApiRegistry.register(
  "UpdateAccount",
  UpdateAccountSchema,
);
export const AccountResponseSchemaRef = openApiRegistry.register(
  "AccountResponse",
  AccountResponseSchema,
);
export const AccountListQuerySchema = openApiRegistry.register(
  "AccountListQuery",
  accountListQuerySchema,
);

// === AUTH ===
export const UserResponseSchemaRef = openApiRegistry.register("UserResponse", UserResponseSchema);
export const LoginRequestSchemaRef = openApiRegistry.register("LoginRequest", LoginRequestSchema);
export const RegisterRequestSchemaRef = openApiRegistry.register(
  "RegisterRequest",
  RegisterRequestSchema,
);
export const AuthTokensSchemaRef = openApiRegistry.register("AuthTokens", AuthTokensSchema);
export const LoginResponseSchemaRef = openApiRegistry.register(
  "LoginResponse",
  LoginResponseSchema,
);
export const RegisterResponseSchemaRef = openApiRegistry.register(
  "RegisterResponse",
  AuthResponseSchema,
);
export const RefreshResponseSchemaRef = openApiRegistry.register(
  "RefreshResponse",
  RefreshResponseSchema,
);

// === COMMON ===
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

// === ENVELOPES: TRANSACTIONS ===
export const TransactionResponseEnvelopeSchema = dataEnvelopeSchema(
  TransactionResponseSchemaRef,
  "TransactionResponseEnvelope",
);
export const TransactionListEnvelopeSchema = paginatedEnvelopeSchema(
  TransactionResponseSchemaRef,
  "TransactionListEnvelope",
);

// === ENVELOPES: TRANSFERS ===
export const TransferResponseEnvelopeSchema = dataEnvelopeSchema(
  TransferResponseSchemaRef,
  "TransferResponseEnvelope",
);
export const TransferListEnvelopeSchema = paginatedEnvelopeSchema(
  TransferResponseSchemaRef,
  "TransferListEnvelope",
);

// === ENVELOPES: ATTACHMENTS ===
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

// === ENVELOPES: ACCOUNTS ===
export const AccountResponseEnvelopeSchema = dataEnvelopeSchema(
  AccountResponseSchemaRef,
  "AccountResponseEnvelope",
);
export const AccountListEnvelopeSchema = paginatedEnvelopeSchema(
  AccountResponseSchemaRef,
  "AccountListEnvelope",
);

// === ENVELOPES: AUTH ===
export const LoginResponseEnvelopeSchema = dataEnvelopeSchema(
  LoginResponseSchemaRef,
  "LoginResponseEnvelope",
);
export const RegisterResponseEnvelopeSchema = dataEnvelopeSchema(
  RegisterResponseSchemaRef,
  "RegisterResponseEnvelope",
);
export const RefreshResponseEnvelopeSchema = dataEnvelopeSchema(
  RefreshResponseSchemaRef,
  "RefreshResponseEnvelope",
);

// === ENVELOPES: COMMON ===
export const DeleteResponseEnvelopeSchema = dataEnvelopeSchema(
  DeleteResponseSchemaRef,
  "DeleteResponseEnvelope",
);
