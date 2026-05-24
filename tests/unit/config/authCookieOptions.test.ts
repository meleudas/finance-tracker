import { getAuthCookieOptions } from "../../../src/config/authCookieOptions";
import { ConfigService } from "../../../src/config/ConfigService";
import type { Env } from "../../../src/config/env";

function makeEnv(overrides: Partial<Env> = {}): Env {
  return {
    NODE_ENV: "test",
    PORT: 3000,
    DATABASE_URL: "postgresql://localhost/db",
    JWT_ACCESS_SECRET: "a".repeat(32),
    JWT_REFRESH_SECRET: "b".repeat(32),
    JWT_ACCESS_TTL: "15m",
    JWT_REFRESH_TTL: "7d",
    JWT_ISSUER: "finance-tracker",
    JWT_AUDIENCE: "finance-tracker-users",
    CORS_ORIGIN: "http://localhost:5173",
    LOG_LEVEL: "silent",
    REDIS_URL: "redis://localhost:6379",
    S3_ENDPOINT: "http://localhost:9000",
    S3_REGION: "us-east-1",
    S3_BUCKET: "finance-tracker",
    S3_ACCESS_KEY_ID: "minioadmin",
    S3_SECRET_ACCESS_KEY: "minioadmin",
    S3_FORCE_PATH_STYLE: true,
    S3_PRESIGNED_URL_EXPIRY_SECONDS: 900,
    ATTACHMENT_MAX_SIZE_BYTES: 5 * 1024 * 1024,
    ATTACHMENT_PRESIGNED_URL_MAX_EXPIRY_SECONDS: 3600,
    TRANSACTION_LIST_CACHE_TTL_SECONDS: 300,
    TRANSACTION_ITEM_CACHE_TTL_SECONDS: 300,
    TRANSFER_LIST_CACHE_TTL_SECONDS: 300,
    TRANSFER_ITEM_CACHE_TTL_SECONDS: 300,
    ATTACHMENT_LIST_CACHE_TTL_SECONDS: 300,
    ATTACHMENT_DOWNLOAD_URL_CACHE_TTL_SECONDS: 240,
    RECURRING_SCHEDULER_ENABLED: false,
    ...overrides,
  } as Env;
}

describe("getAuthCookieOptions", () => {
  it("sameSite none коли secure true", () => {
    const opts = getAuthCookieOptions(new ConfigService(makeEnv({ COOKIE_SECURE: true })));
    expect(opts.secure).toBe(true);
    expect(opts.sameSite).toBe("none");
  });

  it("sameSite lax коли secure false", () => {
    const opts = getAuthCookieOptions(new ConfigService(makeEnv({ COOKIE_SECURE: false })));
    expect(opts.secure).toBe(false);
    expect(opts.sameSite).toBe("lax");
  });
});
