import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { randomUUID } from "node:crypto";
import pinoHttp from "pino-http";
import { config } from "./config/ConfigService";
import { logger } from "./config/logger";
import { csrfProtection, CSRF_HEADER_NAME } from "./middleware/csrfProtection";
import { apiLimiter } from "./middleware/rateLimit";
import { attachAbortSignal } from "./middleware/abortSignal";
import { errorHandler } from "./middleware/errorHandler";
import { notFoundHandler } from "./middleware/notFound";
import { mountOpenApiRoutes } from "./routes/openapi.routes";
import v1Router from "./routes/v1/index";

export function createApp(): express.Application {
  const app = express();
  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(helmet());
  app.use(
    cors({
      origin: config.corsOrigin,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", CSRF_HEADER_NAME, "X-User-Id"],
    }),
  );
  app.use(cookieParser());
  app.use("/api/v1", csrfProtection);
  app.use(
    pinoHttp({
      logger,
      genReqId: function genReqId(req, res) {
        const id = randomUUID();
        res.setHeader("X-Request-Id", id);
        return id;
      },
    }),
  );

  app.use(apiLimiter);

  app.use(express.json({ limit: "1mb" }));
  app.use(attachAbortSignal);

  app.get("/health", (_req, res) => {
    res.status(200).json({ status: "ok" });
  });

  mountOpenApiRoutes(app);

  app.use("/api/v1", v1Router);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
