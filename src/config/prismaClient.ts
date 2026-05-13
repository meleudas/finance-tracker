import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { env } from "./env";
import { logger } from "./logger";
import { withSoftDeleteExtension } from "./prismaSoftDeleteExtension";

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
  const base = new PrismaClient({
    adapter,
    log: [
      { emit: "event", level: "query" },
      { emit: "event", level: "error" },
      { emit: "event", level: "info" },
      { emit: "event", level: "warn" },
    ],
  });

  if (env.NODE_ENV !== "production") {
    base.$on("query", (e) => {
      logger.debug({ query: e.query, params: e.params, duration_ms: e.duration }, "Prisma Query");
    });
  }

  base.$on("error", (e) => {
    logger.error({ target: e.target }, e.message);
  });
  base.$on("warn", (e) => {
    logger.warn({ target: e.target }, e.message);
  });
  base.$on("info", (e) => {
    logger.info({ target: e.target }, e.message);
  });

  return withSoftDeleteExtension(base);
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
