import { API_V1_PREFIX } from "../constants";
import { errorResponses, protectedSecurity } from "../helpers";
import { openApiRegistry } from "../registry";
import {
  CurrencyResponseEnvelopeSchema,
  CurrencyListEnvelopeSchema,
  CurrencyCodeParamsSchema,
  IdParamsSchema,
} from "../schemas/components";

const tag = "Currencies";
const basePath = `${API_V1_PREFIX}/currencies`;

openApiRegistry.registerPath({
  method: "get",
  path: basePath,
  tags: [tag],
  summary: "List currencies",
  description:
    "Returns all active currencies sorted by ISO code. Reference data for accounts, budgets, and transactions.",
  security: protectedSecurity,
  responses: {
    200: {
      description: "List of currencies",
      content: { "application/json": { schema: CurrencyListEnvelopeSchema } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "get",
  path: `${basePath}/code/{code}`,
  tags: [tag],
  summary: "Get currency by ISO code",
  description: "Lookup currency by ISO 4217 code (e.g. UAH, USD). Code is case-insensitive.",
  security: protectedSecurity,
  request: {
    params: CurrencyCodeParamsSchema,
  },
  responses: {
    200: {
      description: "Currency details",
      content: { "application/json": { schema: CurrencyResponseEnvelopeSchema } },
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
