import { openApiRegistry } from "./registry";

openApiRegistry.registerComponent("securitySchemes", "bearerAuth", {
  type: "http",
  scheme: "bearer",
  bearerFormat: "JWT",
  description: "JWT access token (when auth middleware is enabled)",
});

openApiRegistry.registerComponent("securitySchemes", "devUserId", {
  type: "apiKey",
  in: "header",
  name: "X-User-Id",
  description:
    "Development/test only. User id (CUID) when JWT is not configured. Alternatively set DEV_USER_ID in env.",
});

import "./schemas/envelope";
import "./schemas/components";
import "./paths/health.paths";
import "./paths/transactions.paths";
import "./paths/transfers.paths";
import "./paths/attachments.paths";
