import { OpenApiGeneratorV3 } from "@asteasolutions/zod-to-openapi";
import { env } from "../config/env";
import { openApiRegistry } from "./registry";
import "./register";

export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(openApiRegistry.definitions);

  return generator.generateDocument({
    openapi: "3.0.3",
    info: {
      title: "Finance Tracker API",
      version: "1.0.0",
      description:
        "REST API for personal finance tracking. Successful responses use `{ data, meta }`; errors use `{ error: { code, message, requestId } }`.",
    },
    servers: [
      {
        // Host only — paths in spec already include `/api/v1/...` (see API_V1_PREFIX).
        url: `http://localhost:${String(env.PORT)}`,
        description: "Local development",
      },
    ],
    tags: [
      { name: "System", description: "Health and infrastructure" },
      { name: "Auth", description: "Authentication and Authorization" },
      { name: "Transactions", description: "Income and expense entries" },
      { name: "Transfers", description: "Transfers between accounts" },
      { name: "Attachments", description: "Files linked to transactions" },
    ],
  });
}
