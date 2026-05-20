import { API_V1_PREFIX } from "../constants";
import { errorResponses, protectedSecurity } from "../helpers";
import { openApiRegistry } from "../registry";
import {
  CategoryResponseEnvelopeSchema,
  CategoryTreeListEnvelopeSchema,
  CreateCategoryBodySchema,
  UpdateCategoryBodySchema,
  IdParamsSchema,
  DeleteResponseEnvelopeSchema,
} from "../schemas/components";

const tag = "Categories";
const basePath = `${API_V1_PREFIX}/categories`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List categories as tree",
  description:
    "Returns the user's category hierarchy as a nested tree (`children` on each node). Optional query `kind` filters by INCOME or EXPENSE.",
  security: protectedSecurity,
  responses: {
    200: {
      description: "Category tree",
      content: { "application/json": { schema: CategoryTreeListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: basePath,
  tags: [tag],
  summary: "Create category",
  description: "Creates a new category. `parentId` is optional for nested categories.",
  security: protectedSecurity,
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCategoryBodySchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "Category created successfully",
      content: { "application/json": { schema: CategoryResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Get category by ID",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
  },
  responses: {
    200: {
      description: "Category details",
      content: { "application/json": { schema: CategoryResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "patch",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Update category",
  description:
    "Partially updates category fields (`name`, `parentId`). At least one field is required. Moving `parentId` validates ownership, matching `kind`, and prevents cycles.",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateCategoryBodySchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "Category updated successfully",
      content: { "application/json": { schema: CategoryResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Delete category",
  description:
    "Soft-deletes the category and all descendants in the subtree. Returns 409 if any node in the subtree has active (non-deleted) transactions. Budgets linked to deleted categories have `categoryId` set to null.",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
  },
  responses: {
    200: {
      description: "Category subtree soft-deleted",
      content: { "application/json": { schema: DeleteResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});
