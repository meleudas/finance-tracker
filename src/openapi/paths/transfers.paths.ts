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
  AccountScopedIdParamsSchema,
  CreateTransferBodySchema,
  DeleteResponseEnvelopeSchema,
  IdParamsSchema,
  TransferListEnvelopeSchema,
  TransferListQuerySchema,
  TransferResponseEnvelopeSchema,
  UpdateTransferBodySchema,
} from "../schemas/components";

const tag = "Transfers";
const basePath = `${API_V1_PREFIX}/transfers`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List transfers",
  security: protectedSecurity,
  request: { query: TransferListQuerySchema },
  responses: {
    200: {
      description: "Paginated transfers",
      content: { "application/json": { schema: TransferListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: basePath,
  tags: [tag],
  summary: "Create transfer",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    body: { content: { "application/json": { schema: CreateTransferBodySchema } } },
  },
  responses: {
    201: {
      description: "Transfer created",
      content: { "application/json": { schema: TransferResponseEnvelopeSchema } },
    },
    ...mutationErrorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/accounts/{accountId}`,
  tags: [tag],
  summary: "List transfers by account",
  description: "Returns transfers where the account is either source or destination.",
  security: protectedSecurity,
  request: {
    params: AccountScopedIdParamsSchema,
    query: TransferListQuerySchema,
  },
  responses: {
    200: {
      description: "Paginated transfers for account",
      content: { "application/json": { schema: TransferListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Get transfer by id",
  security: protectedSecurity,
  request: { params: IdParamsSchema },
  responses: {
    200: {
      description: "Transfer",
      content: { "application/json": { schema: TransferResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "patch",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Update transfer",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    params: IdParamsSchema,
    body: { content: { "application/json": { schema: UpdateTransferBodySchema } } },
  },
  responses: {
    200: {
      description: "Updated transfer",
      content: { "application/json": { schema: TransferResponseEnvelopeSchema } },
    },
    ...mutationErrorResponses,
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Delete transfer",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: { params: IdParamsSchema },
  responses: {
    200: {
      description: "Soft-deleted transfer",
      content: { "application/json": { schema: DeleteResponseEnvelopeSchema } },
    },
    ...mutationErrorResponses,
  },
});
