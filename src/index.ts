import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import "./config/prismaClient";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info({ port: env.PORT }, "HTTP server listening");
});