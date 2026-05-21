import pino from "pino";
import { env } from "./env";

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

export const logger = pino(
  transport ? { level: env.LOG_LEVEL, transport } : { level: env.LOG_LEVEL },
);
