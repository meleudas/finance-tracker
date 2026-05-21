import { API_V1_PREFIX } from "../constants";
import { errorResponses, protectedSecurity } from "../helpers";
import { openApiRegistry } from "../registry";
import {
  RecurringRuleListEnvelopeSchema,
  RecurringRuleResponseEnvelopeSchema,
  RecurringRuleListQuerySchemaRef,
  CreateRecurringRuleBodySchema,
  UpdateRecurringRuleBodySchema,
  IdParamsSchema,
  DeleteResponseEnvelopeSchema,
} from "../schemas/components";

const tag = "Recurring Rules";
const basePath = `${API_V1_PREFIX}/recurring-rules`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List recurring rules",
  security: protectedSecurity,
  request: { query: RecurringRuleListQuerySchemaRef },
  responses: {
    200: {
      description: "Paginated recurring rules",
      content: { "application/json": { schema: RecurringRuleListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: basePath,
  tags: [tag],
  summary: "Create recurring rule",
  security: protectedSecurity,
  request: {
    body: { content: { "application/json": { schema: CreateRecurringRuleBodySchema } } },
  },
  responses: {
    201: {
      description: "Created rule",
      content: { "application/json": { schema: RecurringRuleResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Get recurring rule by id",
  security: protectedSecurity,
  request: { params: IdParamsSchema },
  responses: {
    200: {
      description: "Recurring rule",
      content: { "application/json": { schema: RecurringRuleResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "patch",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Update recurring rule",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
    body: { content: { "application/json": { schema: UpdateRecurringRuleBodySchema } } },
  },
  responses: {
    200: {
      description: "Updated rule",
      content: { "application/json": { schema: RecurringRuleResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Delete recurring rule",
  security: protectedSecurity,
  request: { params: IdParamsSchema },
  responses: {
    200: {
      description: "Deleted",
      content: { "application/json": { schema: DeleteResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});
