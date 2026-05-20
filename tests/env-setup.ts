/**
 * Runs before test files (see jest.config.cjs `setupFiles`).
 * Ensures `src/config/env` can parse `process.env` when tests import the app.
 */
process.env.NODE_ENV = "test";
process.env.PORT = "3000";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://test:test@localhost:5432/finance_tracker_test?schema=public";
process.env.JWT_ACCESS_SECRET = "test-access-secret-32-characters!!";
process.env.JWT_REFRESH_SECRET = "test-refresh-secret-32-characters!!";
process.env.CORS_ORIGIN = "http://localhost:5173";
process.env.LOG_LEVEL = "silent";
process.env.REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
process.env.S3_ENDPOINT = process.env.S3_ENDPOINT ?? "http://localhost:9000";
process.env.S3_REGION = process.env.S3_REGION ?? "us-east-1";
process.env.S3_BUCKET = process.env.S3_BUCKET ?? "finance-tracker";
process.env.S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID ?? "minioadmin";
process.env.S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY ?? "minioadmin";
process.env.S3_FORCE_PATH_STYLE = process.env.S3_FORCE_PATH_STYLE ?? "true";
process.env.S3_PRESIGNED_URL_EXPIRY_SECONDS = process.env.S3_PRESIGNED_URL_EXPIRY_SECONDS ?? "900";
process.env.ATTACHMENT_MAX_SIZE_BYTES =
  process.env.ATTACHMENT_MAX_SIZE_BYTES ?? String(5 * 1024 * 1024);
process.env.ATTACHMENT_PRESIGNED_URL_MAX_EXPIRY_SECONDS =
  process.env.ATTACHMENT_PRESIGNED_URL_MAX_EXPIRY_SECONDS ?? "3600";
process.env.TRANSACTION_LIST_CACHE_TTL_SECONDS =
  process.env.TRANSACTION_LIST_CACHE_TTL_SECONDS ?? "300";
process.env.TRANSACTION_ITEM_CACHE_TTL_SECONDS =
  process.env.TRANSACTION_ITEM_CACHE_TTL_SECONDS ?? "300";
process.env.TRANSFER_LIST_CACHE_TTL_SECONDS = process.env.TRANSFER_LIST_CACHE_TTL_SECONDS ?? "300";
process.env.TRANSFER_ITEM_CACHE_TTL_SECONDS = process.env.TRANSFER_ITEM_CACHE_TTL_SECONDS ?? "300";
process.env.ATTACHMENT_LIST_CACHE_TTL_SECONDS =
  process.env.ATTACHMENT_LIST_CACHE_TTL_SECONDS ?? "300";
process.env.ATTACHMENT_DOWNLOAD_URL_CACHE_TTL_SECONDS =
  process.env.ATTACHMENT_DOWNLOAD_URL_CACHE_TTL_SECONDS ?? "240";
process.env.RECURRING_SCHEDULER_ENABLED = "false";
