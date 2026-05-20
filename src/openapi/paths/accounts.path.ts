import { openApiRegistry } from "../registry";
import {
  AccountIdParamsSchema,
  CreateAccountBodySchema,
  UpdateAccountBodySchema,
  AccountListQuerySchema,
  AccountResponseEnvelopeSchema,
  AccountListEnvelopeSchema,
  DeleteResponseEnvelopeSchema,
} from "../schemas/components";

openApiRegistry.registerPath({
  method: "get",
  path: "/accounts",
  tags: ["Accounts"],
  summary: "List user accounts",
  description: "Returns paginated list of accounts for the authenticated user",
  security: [{ cookieAuth: [] }, { devUserId: [] }],
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
    401: { description: "Unauthorized" },
    400: { description: "Bad request" },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: "/accounts",
  tags: ["Accounts"],
  summary: "Create new account",
  description: "Creates a new account for the authenticated user",
  security: [{ cookieAuth: [] }, { devUserId: [] }],
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
    401: { description: "Unauthorized" },
    400: { description: "Validation error" },
    409: { description: "Conflict (duplicate name or currency)" },
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: "/accounts/{id}",
  tags: ["Accounts"],
  summary: "Get account by ID",
  description: "Returns details of a specific account owned by the user",
  security: [{ cookieAuth: [] }, { devUserId: [] }],
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
    404: { description: "Account not found" },
    401: { description: "Unauthorized" },
  },
});

openApiRegistry.registerPath({
  method: "patch",
  path: "/accounts/{id}",
  tags: ["Accounts"],
  summary: "Update account",
  description: "Updates name or note of an existing account",
  security: [{ cookieAuth: [] }, { devUserId: [] }],
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
    404: { description: "Account not found" },
    401: { description: "Unauthorized" },
    400: { description: "Validation error" },
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: "/accounts/{id}",
  tags: ["Accounts"],
  summary: "Delete account (soft delete)",
  description: "Marks account as deleted. Fails if account has dependencies",
  security: [{ cookieAuth: [] }, { devUserId: [] }],
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
    404: { description: "Account not found" },
    401: { description: "Unauthorized" },
    409: { description: "Cannot delete (has transactions/budgets)" },
  },
});
