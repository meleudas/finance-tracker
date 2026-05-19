import type { ResponseConfig } from "@asteasolutions/zod-to-openapi";
import type { SecurityRequirementObject } from "openapi3-ts/oas30";
import { ApiErrorResponseSchema } from "./schemas/envelope";

export const protectedSecurity: SecurityRequirementObject[] = [
  { bearerAuth: [] },
  { devUserId: [] },
];

export const errorResponses = {
  400: {
    description: "Validation failed",
    content: {
      "application/json": {
        schema: ApiErrorResponseSchema,
      },
    },
  },
  401: {
    description: "Unauthorized",
    content: {
      "application/json": {
        schema: ApiErrorResponseSchema,
      },
    },
  },
  404: {
    description: "Resource not found",
    content: {
      "application/json": {
        schema: ApiErrorResponseSchema,
      },
    },
  },
  500: {
    description: "Internal server error",
    content: {
      "application/json": {
        schema: ApiErrorResponseSchema,
      },
    },
  },
} satisfies Record<number, ResponseConfig>;
