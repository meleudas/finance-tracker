import type { Logger } from "pino";
import { logger } from "../config/logger";

export function getRequestLogger(req: { log?: Logger }): Logger {
  if (req.log === undefined) {
    return logger;
  }
  return req.log;
}
