import { z } from "../zod";
import { openApiRegistry } from "../registry";

const responseMetaSchema = z.object({
  requestId: z.string().openapi({
    example: "550e8400-e29b-41d4-a716-446655440000",
    description: "Request correlation id (also sent as X-Request-Id)",
  }),
});

export const ResponseMetaSchema = openApiRegistry.register("ResponseMeta", responseMetaSchema);

const paginatedMetaSchema = responseMetaSchema.extend({
  page: z.number().int().openapi({ example: 1 }),
  limit: z.number().int().openapi({ example: 20 }),
  total: z.number().int().openapi({ example: 135 }),
  totalPages: z.number().int().openapi({ example: 7 }),
});

export const PaginatedMetaSchema = openApiRegistry.register("PaginatedMeta", paginatedMetaSchema);

const apiErrorResponseSchema = z
  .object({
    error: z.object({
      code: z.string().openapi({ example: "VALIDATION_FAILED" }),
      message: z.string().openapi({ example: "Invalid request" }),
      requestId: z.string().openapi({ example: "550e8400-e29b-41d4-a716-446655440000" }),
    }),
  })
  .strict();

export const ApiErrorResponseSchema = openApiRegistry.register(
  "ApiErrorResponse",
  apiErrorResponseSchema,
);

const healthResponseSchema = z.object({
  status: z.literal("ok"),
});

export const HealthResponseSchema = openApiRegistry.register(
  "HealthResponse",
  healthResponseSchema,
);

export function dataEnvelopeSchema<T extends z.ZodType>(dataSchema: T, name: string) {
  return openApiRegistry.register(
    name,
    z.object({
      data: dataSchema,
      meta: ResponseMetaSchema,
    }),
  );
}

export function paginatedEnvelopeSchema<T extends z.ZodType>(itemSchema: T, name: string) {
  return openApiRegistry.register(
    name,
    z.object({
      data: z.array(itemSchema),
      meta: PaginatedMetaSchema,
    }),
  );
}
