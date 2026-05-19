import { openApiRegistry } from "../registry";
import { z } from "../zod";
import { registerSchema } from "../../validators/auth/registerSchema";
import { loginSchema } from "../../validators/auth/loginSchema";
import { userResponseSchema } from "../../dtos/users/userResponseSchema";

const authTags = ["Auth"];

const userSuccessResponse = z.object({
  success: z.boolean().openapi({ example: true }),
  data: z.object({
    user: userResponseSchema,
  }),
});

const simpleSuccessResponse = z.object({
  success: z.boolean().openapi({ example: true }),
});

openApiRegistry.registerPath({
  method: "post",
  path: "/auth/register",
  tags: authTags,
  summary: "Register a new user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: registerSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: "User successfully registered",
      content: {
        "application/json": {
          schema: userSuccessResponse,
        },
      },
    },
    400: {
      description: "Validation error",
    },
    409: {
      description: "User already exists",
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: "/auth/login",
  tags: authTags,
  summary: "Log in a user",
  request: {
    body: {
      content: {
        "application/json": {
          schema: loginSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: "User successfully logged in",
      content: {
        "application/json": {
          schema: userSuccessResponse,
        },
      },
    },
    400: {
      description: "Validation error",
    },
    401: {
      description: "Unauthorized",
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: "/auth/refresh",
  tags: authTags,
  summary: "Refresh access token",
  responses: {
    200: {
      description: "Token successfully refreshed",
      content: {
        "application/json": {
          schema: simpleSuccessResponse,
        },
      },
    },
    401: {
      description: "Unauthorized or token blacklisted",
    },
  },
});

openApiRegistry.registerPath({
  method: "post",
  path: "/auth/logout",
  tags: authTags,
  summary: "Log out a user",
  security: [{ bearerAuth: [] }],
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
  },
});
