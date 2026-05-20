import { API_V1_PREFIX } from "../constants";
import { errorResponses, protectedSecurity } from "../helpers";
import { openApiRegistry } from "../registry";
import {
  CurrencyResponseEnvelopeSchema,
  CurrencyListEnvelopeSchema,
  IdParamsSchema,
} from "../schemas/components";

const tag = "Currencies";
const basePath = `${API_V1_PREFIX}/currencies`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List currencies",
  description: "Returns a paginated list of available currencies. Typically used for dropdowns and reference data.",
  security: protectedSecurity,
  responses: {
    200: {
      description: "Paginated list of currencies",
      content: { "application/json": { schema: CurrencyListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/{id}`,
  tags: [tag],
  summary: "Get currency by ID",
  security: protectedSecurity,
  request: {
    params: IdParamsSchema,
  },
  responses: {
    200: {
      description: "Currency details",
      content: { "application/json": { schema: CurrencyResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

// Примітка: Create/Update/Delete для Currency зазвичай не потрібні,
// оскільки валюти — це довідник, що заповнюється адміністратором.
// Якщо потрібно — розкоментуйте та додайте відповідні схеми.

/*
openApiRegistry.registerPath({
  method: "post",
  path: basePath,
  tags: [tag],
  summary: "Create currency",
  security: protectedSecurity,
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateCurrencyBodySchema, // потрібно створити
        },
      },
    },
  },
  responses: {
    201: {
      description: "Currency created",
      content: { "application/json": { schema: CurrencyResponseEnvelopeSchema } },
    },
    ...errorResponses,
  },
});
*/