import { API_V1_PREFIX } from "../constants";
import { errorResponses, protectedSecurity } from "../helpers";
import { openApiRegistry } from "../registry";
import {
  CategoryResponseEnvelopeSchema,
  CategoryListEnvelopeSchema,
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
  summary: "List categories",
  description: "Returns a paginated list of categories. Supports filtering by `kind` (INCOME/EXPENSE) and `parentId` for tree structure.",
  security: protectedSecurity,
  responses: {
    200: {
      description: "Paginated list of categories",
      content: { "application/json": { schema: CategoryListEnvelopeSchema } },
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
  description: "Partially updates category fields. All fields are optional.",
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
  description: "Soft-deletes a category. Child categories are NOT automatically deleted.",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
  },
  responses: {
    200: {
      description: "Category soft-deleted",
      content: { "application/json": { schema: DeleteResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});