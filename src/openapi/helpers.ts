import type { ResponseConfig } from "@asteasolutions/zod-to-openapi";
import type { ParameterObject, SecurityRequirementObject } from "openapi3-ts/oas30";
import { CSRF_HEADER_NAME } from "../middleware/csrfProtection";
import { ApiErrorResponseSchema } from "./schemas/envelope";

export const protectedSecurity: SecurityRequirementObject[] = [
  { cookieAuth: [] },
  { devUserId: [] },
];

/** Use on POST / PUT / PATCH / DELETE when cookie session or auth mutations require CSRF. */
export const protectedMutationSecurity: SecurityRequirementObject[] = [
  ...protectedSecurity,
  { csrfHeader: [] },
];

export const authMutationSecurity: SecurityRequirementObject[] = [{ csrfHeader: [] }];

export const csrfHeaderParameter: ParameterObject = {
  name: CSRF_HEADER_NAME,
  in: "header",
  required: true,
  schema: { type: "string" },
  description:
    "CSRF token from GET /api/v1/auth/csrf. Must match the csrfToken cookie (double-submit). Required for cookie-based sessions after login.",
};

export function appendCsrfParameters(
  parameters: readonly ParameterObject[] = [],
): ParameterObject[] {
  const hasCsrf = parameters.some((p) => p.name === CSRF_HEADER_NAME);
  return hasCsrf ? [...parameters] : [...parameters, csrfHeaderParameter];
}

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

export const mutationErrorResponses = {
  ...errorResponses,
  403: {
    description: "Invalid or missing CSRF token",
    content: {
      "application/json": {
        schema: ApiErrorResponseSchema,
      },
    },
  },
} satisfies Record<number, ResponseConfig>;
