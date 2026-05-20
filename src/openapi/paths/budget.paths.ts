import { API_V1_PREFIX } from "../constants";
import { errorResponses, protectedSecurity } from "../helpers";
import { openApiRegistry } from "../registry";
import {
  BudgetResponseEnvelopeSchema,
  BudgetListEnvelopeSchema,
  BudgetProgressListEnvelopeSchema,
  BudgetQuerySchemaRef,
  BudgetProgressQuerySchema,
  CreateBudgetBodySchema,
  UpdateBudgetBodySchema,
  UpdateBudgetLimitBodySchema,
  IdParamsSchema,
  DeleteResponseEnvelopeSchema,
} from "../schemas/components";

const tag = "Budgets";
const basePath = `${API_V1_PREFIX}/budgets`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List budgets",
  description:
    "Returns a paginated list of budgets for the authenticated user. Supports filtering by account, category, and date range.",
  security: protectedSecurity,
  request: {
    query: BudgetQuerySchemaRef,
  },
  responses: {
    200: {
      description: "Paginated list of budgets",
      content: { "application/json": { schema: BudgetListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/progress`,
  tags: [tag],
  summary: "Get budgets progress",
  description:
    "Returns spending progress for all active budgets on the given date (defaults to today).",
  security: protectedSecurity,
  request: {
    query: BudgetProgressQuerySchema,
  },
  responses: {
    200: {
      description: "Budget progress list",
      content: { "application/json": { schema: BudgetProgressListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: basePath,
  tags: [tag],
  summary: "Create budget",
  description: "Creates a new budget. `periodEnd` must be strictly after `periodStart`.",
  security: protectedSecurity,
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateBudgetBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Budget created successfully",
      content: { "application/json": { schema: BudgetResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Get budget by ID",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
  },
  responses: {
    200: {
      description: "Budget details with calculated fields (spentAmount, remainingAmount)",
      content: { "application/json": { schema: BudgetResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "patch",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Update budget",
  description:
    "Partially updates budget name, period, or limit. Account and currency cannot be changed.",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateBudgetBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Budget updated successfully",
      content: { "application/json": { schema: BudgetResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "put",
  path: `${basePath}/{id}/limit`,
  tags: [tag],
  summary: "Update budget limit",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateBudgetLimitBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Budget limit updated",
      content: { "application/json": { schema: BudgetResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Delete budget",
  description: "Soft-deletes a budget.",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
  },
  responses: {
    200: {
      description: "Budget soft-deleted",
      content: { "application/json": { schema: DeleteResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});
