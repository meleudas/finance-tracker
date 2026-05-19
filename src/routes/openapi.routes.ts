import type { Application, Request, Response } from "express";
import helmet from "helmet";
import swaggerUi from "swagger-ui-express";
import { generateOpenApiDocument } from "../openapi/document";

let cachedDocument: ReturnType<typeof generateOpenApiDocument> | undefined;

function getOpenApiDocument() {
  cachedDocument ??= generateOpenApiDocument();
  return cachedDocument;
}

const swaggerHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
    },
  },
});

export function mountOpenApiRoutes(app: Application): void {
  app.get("/api/openapi.json", (_req: Request, res: Response) => {
    res.json(getOpenApiDocument());
  });

  app.use(
    "/api/docs",
    swaggerHelmet,
    swaggerUi.serve,
    swaggerUi.setup(getOpenApiDocument(), {
      customSiteTitle: "Finance Tracker API",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
      },
    }),
  );
}
