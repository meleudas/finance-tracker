import { API_V1_PREFIX } from "../constants";
import {
  appendCsrfParameters,
  errorResponses,
  mutationErrorResponses,
  protectedMutationSecurity,
  protectedSecurity,
} from "../helpers";
import { openApiRegistry } from "../registry";
import { ApiErrorResponseSchema } from "../schemas/envelope";
import {
  AccountIdParamsSchema,
  CreateAccountBodySchema,
  UpdateAccountBodySchema,
  AccountListQuerySchema,
  AccountResponseEnvelopeSchema,
  AccountListEnvelopeSchema,
  DeleteResponseEnvelopeSchema,
} from "../schemas/components";

const tag = "Accounts";
const basePath = `${API_V1_PREFIX}/accounts`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List user accounts",
  description:
    "Returns paginated list of accounts for the authenticated user. Query `includeDeleted=true` returns both active and soft-deleted accounts; default lists active only.",
  security: protectedSecurity,
  request: {
    query: AccountListQuerySchema,
  },
  responses: {
    200: {
      description: "List of accounts",
      content: {
        "application/json": {
          schema: AccountListEnvelopeSchema,
        },
      },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: basePath,
  tags: [tag],
  summary: "Create new account",
  description:
    "Creates a new account for the authenticated user. Requires x-csrf-token header when using cookie auth (see GET /auth/csrf).",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateAccountBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Account created",
      content: {
        "application/json": {
          schema: AccountResponseEnvelopeSchema,
        },
      },
    },
    ...mutationErrorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Get account by ID",
  description: "Returns details of a specific account owned by the user",
  security: protectedSecurity,
  request: {
    params: AccountIdParamsSchema,
  },
  responses: {
    200: {
      description: "Account details",
      content: {
        "application/json": {
          schema: AccountResponseEnvelopeSchema,
        },
      },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "patch",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Update account",
  description:
    "Updates the name of an existing account. Requires x-csrf-token header when using cookie auth.",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    params: AccountIdParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateAccountBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Account updated",
      content: {
        "application/json": {
          schema: AccountResponseEnvelopeSchema,
        },
      },
    },
    ...mutationErrorResponses,
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Delete account (soft delete)",
  description:
    "Marks account as deleted. Returns 409 if the account has active transactions, budgets, transfers, or recurring rules. Requires x-csrf-token header when using cookie auth.",
  security: protectedMutationSecurity,
  parameters: appendCsrfParameters(),
  request: {
    params: AccountIdParamsSchema,
  },
  responses: {
    200: {
      description: "Account deleted",
      content: {
        "application/json": {
          schema: DeleteResponseEnvelopeSchema,
        },
      },
    },
    409: {
      description: "Cannot delete (has transactions/budgets/transfers/recurring rules)",
      content: {
        "application/json": {
          schema: ApiErrorResponseSchema,
        },
      },
    },
    ...mutationErrorResponses,
  },
});
