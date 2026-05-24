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
import { confirmPresignedUploadSchema, uploadAttachmentSchema } from "../../dtos/attachment";
import { deleteResponseSchema } from "../../dtos/common";
import { attachmentIdParamSchema, idDtoSchema, transactionIdParamSchema } from "../../dtos/common";
import { openApiRegistry } from "../registry";
import { dataEnvelopeSchema, paginatedEnvelopeSchema } from "./envelope";
import { CreateBudgetSchema } from "../../dtos/budget/CreateBudget.dto";
import { UpdateBudgetSchema } from "../../dtos/budget/UpdateBudget.dto";
import { UpdateBudgetLimitSchema } from "../../dtos/budget/UpdateBudgetLimit.dto";
import { BudgetQuerySchema } from "../../dtos/budget/BudgetQuery.dto";
import { BudgetResponseSchema } from "../../dtos/budget/BudgetResponse.dto";
import { BudgetProgressResponseSchema } from "../../dtos/budget/BudgetProgress.dto";
import {
  CurrencyResponseSchema,
  PublicCurrencyResponseSchema,
} from "../../dtos/currency/CurrencyResponse.dto";
import { currencyCodeParamSchema } from "../../validators/currency.validator";
import { CreateCategorySchema } from "../../dtos/category/CreateCategory.dto";
import { UpdateCategorySchema } from "../../dtos/category/UpdateCategory.dto";
import { CategoryResponseSchema } from "../../dtos/category/CategoryResponse.dto";

// === ACCOUNTS IMPORTS ===
import { CreateAccountSchema } from "../../dtos/account/CreateAccount.dto";
import { UpdateAccountSchema } from "../../dtos/account/UpdateAccount.dto";
import { AccountResponseSchema } from "../../dtos/account/AccountResponse.dto";
import { accountListQuerySchema } from "../../dtos/account/AccountListQuery.dto";
import {
  reportQuerySchema,
  financialReportSchema,
  createReportJobSchema,
  reportJobResponseSchema,
} from "../../dtos/report";
import {
  CreateRecurringFrequencySchema,
  UpdateRecurringFrequencySchema,
  RecurringFrequencyResponseSchema,
  recurringFrequencyListQuerySchema,
} from "../../dtos/recurring-frequency";
import {
  CreateRecurringRuleSchema,
  UpdateRecurringRuleSchema,
  RecurringRuleResponseSchema,
  recurringRuleListQuerySchema,
} from "../../dtos/recurring-rule";

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
export const AccountScopedIdParamsSchema = openApiRegistry.register(
  "AccountScopedIdParams",
  z.object({ accountId: idDtoSchema.shape.id }),
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
export const ConfirmPresignedUploadBodySchema = openApiRegistry.register(
  "ConfirmPresignedUpload",
  confirmPresignedUploadSchema,
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

// Budget schemas
export const CreateBudgetBodySchema = openApiRegistry.register("CreateBudget", CreateBudgetSchema);

export const UpdateBudgetBodySchema = openApiRegistry.register("UpdateBudget", UpdateBudgetSchema);

export const UpdateBudgetLimitBodySchema = openApiRegistry.register(
  "UpdateBudgetLimit",
  UpdateBudgetLimitSchema,
);

export const BudgetQuerySchemaRef = openApiRegistry.register("BudgetQuery", BudgetQuerySchema);

export const BudgetProgressResponseSchemaRef = openApiRegistry.register(
  "BudgetProgressResponse",
  BudgetProgressResponseSchema,
);

export const BudgetProgressQuerySchema = openApiRegistry.register(
  "BudgetProgressQuery",
  z.object({
    date: z.coerce.date().optional().openapi({
      description: "Target date for progress (defaults to today)",
    }),
  }),
);

export const BudgetResponseSchemaRef = openApiRegistry.register(
  "BudgetResponse",
  BudgetResponseSchema,
);

// Currency schemas
export const CurrencyResponseSchemaRef = openApiRegistry.register(
  "CurrencyResponse",
  CurrencyResponseSchema,
);

export const PublicCurrencyResponseSchemaRef = openApiRegistry.register(
  "PublicCurrencyResponse",
  PublicCurrencyResponseSchema,
);

export const CurrencyCodeParamsSchema = openApiRegistry.register(
  "CurrencyCodeParams",
  currencyCodeParamSchema,
);

export const CreateCategoryBodySchema = openApiRegistry.register(
  "CreateCategory",
  CreateCategorySchema,
);

export const UpdateCategoryBodySchema = openApiRegistry.register(
  "UpdateCategory",
  UpdateCategorySchema,
);

export const categoryTreeNodeSchema: z.ZodType<
  z.infer<typeof CategoryResponseSchema> & {
    children: z.infer<typeof categoryTreeNodeSchema>[];
  }
> = z.lazy(() =>
  CategoryResponseSchema.extend({
    children: z.array(categoryTreeNodeSchema),
  }),
);

export const CategoryTreeNodeSchemaRef = openApiRegistry.register(
  "CategoryTreeNode",
  categoryTreeNodeSchema,
);

export const CategoryResponseSchemaRef = openApiRegistry.register(
  "CategoryResponse",
  CategoryResponseSchema,
);

export const BudgetResponseEnvelopeSchema = dataEnvelopeSchema(
  BudgetResponseSchemaRef,
  "BudgetResponseEnvelope",
);
export const BudgetListEnvelopeSchema = paginatedEnvelopeSchema(
  BudgetResponseSchemaRef,
  "BudgetListEnvelope",
);

export const BudgetProgressListEnvelopeSchema = dataEnvelopeSchema(
  z.array(BudgetProgressResponseSchemaRef),
  "BudgetProgressListEnvelope",
);

// Currency envelopes
export const CurrencyResponseEnvelopeSchema = dataEnvelopeSchema(
  PublicCurrencyResponseSchemaRef,
  "CurrencyResponseEnvelope",
);
export const CurrencyListEnvelopeSchema = dataEnvelopeSchema(
  z.array(PublicCurrencyResponseSchemaRef),
  "CurrencyListEnvelope",
);

// Category envelopes
export const CategoryResponseEnvelopeSchema = dataEnvelopeSchema(
  CategoryResponseSchemaRef,
  "CategoryResponseEnvelope",
);
export const CategoryTreeListEnvelopeSchema = dataEnvelopeSchema(
  z.array(CategoryTreeNodeSchemaRef),
  "CategoryTreeListEnvelope",
);

// Reports
export const ReportQuerySchemaRef = openApiRegistry.register("ReportQuery", reportQuerySchema);

export const FinancialReportSchemaRef = openApiRegistry.register(
  "FinancialReport",
  financialReportSchema,
);

export const FinancialReportEnvelopeSchema = dataEnvelopeSchema(
  FinancialReportSchemaRef,
  "FinancialReportEnvelope",
);

export const CreateReportJobBodySchema = openApiRegistry.register(
  "CreateReportJob",
  createReportJobSchema,
);

export const ReportJobResponseSchemaRef = openApiRegistry.register(
  "ReportJobResponse",
  reportJobResponseSchema,
);

export const ReportJobResponseEnvelopeSchema = dataEnvelopeSchema(
  ReportJobResponseSchemaRef,
  "ReportJobResponseEnvelope",
);

// Recurring frequency
export const CreateRecurringFrequencyBodySchema = openApiRegistry.register(
  "CreateRecurringFrequency",
  CreateRecurringFrequencySchema,
);

export const UpdateRecurringFrequencyBodySchema = openApiRegistry.register(
  "UpdateRecurringFrequency",
  UpdateRecurringFrequencySchema,
);

export const RecurringFrequencyResponseSchemaRef = openApiRegistry.register(
  "RecurringFrequencyResponse",
  RecurringFrequencyResponseSchema,
);

export const RecurringFrequencyListQuerySchemaRef = openApiRegistry.register(
  "RecurringFrequencyListQuery",
  recurringFrequencyListQuerySchema,
);

export const RecurringFrequencyResponseEnvelopeSchema = dataEnvelopeSchema(
  RecurringFrequencyResponseSchemaRef,
  "RecurringFrequencyResponseEnvelope",
);

export const RecurringFrequencyListEnvelopeSchema = paginatedEnvelopeSchema(
  RecurringFrequencyResponseSchemaRef,
  "RecurringFrequencyListEnvelope",
);

// Recurring rules
export const CreateRecurringRuleBodySchema = openApiRegistry.register(
  "CreateRecurringRule",
  CreateRecurringRuleSchema,
);

export const UpdateRecurringRuleBodySchema = openApiRegistry.register(
  "UpdateRecurringRule",
  UpdateRecurringRuleSchema,
);

export const RecurringRuleResponseSchemaRef = openApiRegistry.register(
  "RecurringRuleResponse",
  RecurringRuleResponseSchema,
);

export const RecurringRuleListQuerySchemaRef = openApiRegistry.register(
  "RecurringRuleListQuery",
  recurringRuleListQuerySchema,
);

export const RecurringRuleResponseEnvelopeSchema = dataEnvelopeSchema(
  RecurringRuleResponseSchemaRef,
  "RecurringRuleResponseEnvelope",
);

export const RecurringRuleListEnvelopeSchema = paginatedEnvelopeSchema(
  RecurringRuleResponseSchemaRef,
  "RecurringRuleListEnvelope",
);
