import { errorResponses } from "../helpers";
import { openApiRegistry } from "../registry";
import { HealthResponseSchema } from "../schemas/envelope";

openApiRegistry.registerPath({
  method: "get",
  path: "/health",
  tags: ["System"],
  summary: "Health check",
  responses: {
    200: {
      description: "Service is up",
      content: { "application/json": { schema: HealthResponseSchema } },
    },
    ...errorResponses,
  },
});
