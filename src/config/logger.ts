import pino from "pino";
import { env } from "./env";

const REDACT_PATHS = [
  "req.headers.authorization",
  "req.headers.cookie",
  "password",
  "refreshToken",
  "accessToken",
  "token",
  "*.password",
  "*.refreshToken",
  "*.accessToken",
  "*.token",
];

function getDevTransport(): pino.TransportSingleOptions | undefined {
  if (env.NODE_ENV !== "development") {
    return undefined;
  }
  try {
    require.resolve("pino-pretty");
  } catch {
    return undefined;
  }
  return { target: "pino-pretty", options: { colorize: true } };
}

const transport = getDevTransport();

const loggerOptions: pino.LoggerOptions = {
  level: env.LOG_LEVEL,
  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
  },
  ...(transport ? { transport } : {}),
};

export const logger = pino(loggerOptions);

export function createModuleLogger(module: string): pino.Logger {
  return logger.child({ module });
}
