import { openApiRegistry } from "../registry";
import { z } from "../zod";
import { API_V1_PREFIX } from "../constants";
import {
  appendCsrfParameters,
  authMutationSecurity,
  errorResponses,
  protectedSecurity,
} from "../helpers";
import { UserResponseSchema } from "../../dtos/users/UserResponse.dto";
import { registerSchema } from "../../validators/registerSchema";
import { loginSchema } from "../../validators/loginSchema";
const authTags = ["Auth"];
const authBasePath = `${API_V1_PREFIX}/auth`;

const authTokensSchema = z.object({
  accessToken: z
    .string()
    .openapi({ description: "JWT access token (also set in httpOnly cookie)" }),
  refreshToken: z
    .string()
    .openapi({ description: "JWT refresh token (also set in httpOnly cookie)" }),
});

const registerLoginSuccessResponse = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    user: UserResponseSchema,
    accessToken: authTokensSchema.shape.accessToken,
    refreshToken: authTokensSchema.shape.refreshToken,
  }),
});

const refreshSuccessResponse = z.object({
  success: z.boolean().openapi({ example: true }),
  data: authTokensSchema,
});

const csrfSuccessResponse = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    csrfToken: z
      .string()
      .openapi({ description: "CSRF token; send as X-CSRF-Token header on POST" }),
  }),
});

const simpleSuccessResponse = z.object({
  success: z.boolean().openapi({ example: true }),
});

openApiRegistry.registerPath({
  method: "get",
  path: `${authBasePath}/csrf`,
  tags: authTags,
  summary: "Get CSRF token",
  description:
    "Issues a CSRF token cookie and returns the token for use in X-CSRF-Token header on POST requests.",
  responses: {
    200: {
      description: "CSRF token issued",
      content: { "application/json": { schema: csrfSuccessResponse } },
    },
    ...errorResponses,
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: `${authBasePath}/register`,
  tags: authTags,
  summary: "Register a new user",
  description:
    "Creates a user and returns tokens in JSON (dual mode) plus httpOnly cookies. Requires X-CSRF-Token header.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },
  security: authMutationSecurity,
  parameters: appendCsrfParameters(),
  responses: {
    201: {
      description: "User successfully registered",
      content: {
        "application/json": {
          schema: registerLoginSuccessResponse,
        },
      },
    },
    400: {
      description: "Validation error",
    },
    403: {
      description: "Invalid CSRF token",
    },
    409: {
      description: "User already exists",
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: `${authBasePath}/login`,
  tags: authTags,
  summary: "Log in a user",
  description:
    "Authenticates user; returns tokens in JSON (dual mode) plus httpOnly cookies. Requires X-CSRF-Token header.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  security: authMutationSecurity,
  parameters: appendCsrfParameters(),
  responses: {
    200: {
      description: "User successfully logged in",
      content: {
        "application/json": {
          schema: registerLoginSuccessResponse,
        },
      },
    },
    400: {
      description: "Validation error",
    },
    401: {
      description: "Unauthorized",
    },
    403: {
      description: "Invalid CSRF token",
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: `${authBasePath}/refresh`,
  tags: authTags,
  summary: "Refresh access token",
  description:
    "Rotates tokens using refreshToken from httpOnly cookie or optional JSON body. Requires X-CSRF-Token header.",
  request: {
    body: {
      content: {
        "application/json": {
          schema: z
            .object({
              refreshToken: z.string().optional(),
            })
            .optional(),
        },
      },
    },
  },
  security: authMutationSecurity,
  parameters: appendCsrfParameters(),
  responses: {
    200: {
      description: "Token successfully refreshed",
      content: {
        "application/json": {
          schema: refreshSuccessResponse,
        },
      },
    },
    401: {
      description: "Unauthorized or token blacklisted",
    },
    403: {
      description: "Invalid CSRF token",
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: `${authBasePath}/logout`,
  tags: authTags,
  summary: "Log out a user",
  description:
    "Blacklists tokens and clears auth cookies. Requires access JWT and X-CSRF-Token header.",
  security: [...protectedSecurity, ...authMutationSecurity],
  parameters: appendCsrfParameters(),
  responses: {
    200: {
      description: "User successfully logged out",
      content: {
        "application/json": {
          schema: simpleSuccessResponse,
        },
      },
    },
    401: {
      description: "Unauthorized",
    },
    403: {
      description: "Invalid CSRF token",
    },
  },
});
