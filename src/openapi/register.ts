import { openApiRegistry } from "./registry";

openApiRegistry.registerComponent("securitySchemes", "cookieAuth", {
  type: "apiKey",
  in: "cookie",
  name: "accessToken",
  description: "JWT access token passed in HttpOnly cookie",
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
import "./paths/auth.paths";
import "./paths/accounts.path";
import "./paths/budget.paths";
import "./paths/category.paths";
import "./paths/currency.paths";
import "./paths/reports.paths";
import "./paths/recurring-frequencies.paths";
import "./paths/recurring-rules.paths";
