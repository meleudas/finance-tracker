import { API_V1_PREFIX } from "../constants";
import { errorResponses, protectedSecurity } from "../helpers";
import { openApiRegistry } from "../registry";
import { ApiErrorResponseSchema } from "../schemas/envelope";
import {
  AccountIdParamsSchema,
  CategoryIdParamsSchema,
  CreateTransactionBodySchema,
  DeleteResponseEnvelopeSchema,
  IdParamsSchema,
  TransactionListEnvelopeSchema,
  TransactionListQuerySchema,
  TransactionResponseEnvelopeSchema,
  UpdateTransactionBodySchema,
} from "../schemas/components";

const tag = "Transactions";
const basePath = `${API_V1_PREFIX}/transactions`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List transactions",
  description: "Returns a paginated list of transactions for the authenticated user.",
  security: protectedSecurity,
  request: { query: TransactionListQuerySchema },
  responses: {
    200: {
      description: "Paginated transactions",
      content: { "application/json": { schema: TransactionListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: basePath,
  tags: [tag],
  summary: "Create transaction",
  security: protectedSecurity,
  request: {
    body: {
      content: { "application/json": { schema: CreateTransactionBodySchema } },
    },
  },
  responses: {
    201: {
      description: "Transaction created",
      content: { "application/json": { schema: TransactionResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/accounts/{accountId}`,
  tags: [tag],
  summary: "List transactions by account",
  security: protectedSecurity,
  request: {
    params: AccountIdParamsSchema,
    query: TransactionListQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated transactions for account",
      content: { "application/json": { schema: TransactionListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/categories/{categoryId}`,
  tags: [tag],
  summary: "List transactions by category",
  security: protectedSecurity,
  request: {
    params: CategoryIdParamsSchema,
    query: TransactionListQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated transactions for category",
      content: { "application/json": { schema: TransactionListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Get transaction by id",
  security: protectedSecurity,
  request: { params: IdParamsSchema },
  responses: {
    200: {
      description: "Transaction",
      content: { "application/json": { schema: TransactionResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "patch",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Update transaction",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
    body: { content: { "application/json": { schema: UpdateTransactionBodySchema } } },
  },
  responses: {
    200: {
      description: "Updated transaction",
      content: { "application/json": { schema: TransactionResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Delete transaction",
  description:
    "Soft-deletes the transaction. Returns 409 if the transaction still has attachments.",
  security: protectedSecurity,
  request: { params: IdParamsSchema },
  responses: {
    200: {
      description: "Soft-deleted transaction",
      content: { "application/json": { schema: DeleteResponseEnvelopeSchema } },
    },
    409: {
      description: "Cannot delete (has attachments)",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    ...errorResponses,
  },
});
