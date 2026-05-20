import { API_V1_PREFIX } from "../constants";
import { errorResponses, protectedSecurity } from "../helpers";
import { openApiRegistry } from "../registry";
import {
  RecurringFrequencyListEnvelopeSchema,
  RecurringFrequencyResponseEnvelopeSchema,
  RecurringFrequencyListQuerySchemaRef,
  CreateRecurringFrequencyBodySchema,
  UpdateRecurringFrequencyBodySchema,
  IdParamsSchema,
  DeleteResponseEnvelopeSchema,
} from "../schemas/components";

const tag = "Recurring Frequencies";
const basePath = `${API_V1_PREFIX}/recurring-frequencies`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List recurring frequency templates",
  security: protectedSecurity,
  request: { query: RecurringFrequencyListQuerySchemaRef },
  responses: {
    200: {
      description: "Paginated frequency templates",
      content: { "application/json": { schema: RecurringFrequencyListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: basePath,
  tags: [tag],
  summary: "Create recurring frequency template",
  security: protectedSecurity,
  request: {
    body: { content: { "application/json": { schema: CreateRecurringFrequencyBodySchema } } },
  },
  responses: {
    201: {
      description: "Created frequency",
      content: { "application/json": { schema: RecurringFrequencyResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Get recurring frequency by id",
  security: protectedSecurity,
  request: { params: IdParamsSchema },
  responses: {
    200: {
      description: "Frequency template",
      content: { "application/json": { schema: RecurringFrequencyResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "patch",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Update recurring frequency",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
    body: { content: { "application/json": { schema: UpdateRecurringFrequencyBodySchema } } },
  },
  responses: {
    200: {
      description: "Updated frequency",
      content: { "application/json": { schema: RecurringFrequencyResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "delete",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Delete recurring frequency",
  description: "Returns 409 if active recurring rules reference this frequency.",
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
