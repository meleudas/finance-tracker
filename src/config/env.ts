import "dotenv/config";
import { z } from "zod";

// Prisma @default(cuid()) generates CUID v1; keep z.cuid() until schema migrates to cuid2.
// eslint-disable-next-line @typescript-eslint/no-deprecated -- matches Prisma cuid() v1
const cuidSchema = z.cuid();

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CORS_ORIGIN: z.string().min(1),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]),
  REDIS_URL: z
    .string()
    .regex(/^rediss?:\/\//, "REDIS_URL must be a redis:// or rediss:// URL")
    .default("redis://localhost:6379"),
  S3_ENDPOINT: z.url().default("http://localhost:9000"),
  S3_REGION: z.string().min(1).default("us-east-1"),
  S3_BUCKET: z.string().min(1).default("finance-tracker"),
  S3_ACCESS_KEY_ID: z.string().min(1).default("minioadmin"),
  S3_SECRET_ACCESS_KEY: z.string().min(1).default("minioadmin"),
  S3_FORCE_PATH_STYLE: z
    .enum(["true", "false"])
    .default("true")
    .transform((value) => value === "true"),
  /** Default TTL for S3/MinIO presigned GET and PUT URLs (seconds). */
  S3_PRESIGNED_URL_EXPIRY_SECONDS: z.coerce.number().int().min(60).max(86400).default(900),
  /** Max upload size for transaction attachments (bytes). */
  ATTACHMENT_MAX_SIZE_BYTES: z.coerce
    .number()
    .int()
    .positive()
    .default(5 * 1024 * 1024),
  /** Max ?expiresInSeconds= override on attachment download URL endpoints. */
  ATTACHMENT_PRESIGNED_URL_MAX_EXPIRY_SECONDS: z.coerce
    .number()
    .int()
    .min(60)
    .max(86400)
    .default(3600),
  TRANSACTION_LIST_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  TRANSACTION_ITEM_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  TRANSFER_LIST_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  TRANSFER_ITEM_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  ATTACHMENT_LIST_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  ATTACHMENT_DOWNLOAD_URL_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(240),
  ACCOUNT_LIST_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  ACCOUNT_ITEM_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(600),
  CATEGORY_TREE_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  CATEGORY_ITEM_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(600),
  BUDGET_LIST_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(300),
  BUDGET_ITEM_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(120),
  BUDGET_PROGRESS_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(3600).default(60),
  CURRENCY_LIST_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(86400).default(3600),
  CURRENCY_ITEM_CACHE_TTL_SECONDS: z.coerce.number().int().min(30).max(86400).default(3600),
  /** Dev/test only: default acting user when auth middleware is not wired yet. */
  DEV_USER_ID: cuidSchema.optional(),
  JWT_ACCESS_TTL: z.string().default("15m"),
  JWT_REFRESH_TTL: z.string().default("7d"),
  JWT_ISSUER: z.string().default("finance-tracker-api"),
  JWT_AUDIENCE: z.string().default("finance-tracker-api"),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    console.error("Invalid environment variables:", z.flattenError(parsed.error).fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
