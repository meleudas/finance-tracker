import { Client } from "minio";
import { env } from "./env";

function parseS3Endpoint(endpoint: string): {
  endPoint: string;
  port: number;
  useSSL: boolean;
} {
  const url = new URL(endpoint);
  const useSSL = url.protocol === "https:";
  const port = url.port ? Number.parseInt(url.port, 10) : useSSL ? 443 : 9000;

  return {
    endPoint: url.hostname,
    port,
    useSSL,
  };
}

function createMinioClient(endpoint: string): Client {
  const parsed = parseS3Endpoint(endpoint);
  return new Client({
    endPoint: parsed.endPoint,
    port: parsed.port,
    useSSL: parsed.useSSL,
    accessKey: env.S3_ACCESS_KEY_ID,
    secretKey: env.S3_SECRET_ACCESS_KEY,
    region: env.S3_REGION,
    pathStyle: env.S3_FORCE_PATH_STYLE,
  });
}

/** Internal Docker/network endpoint for putObject, getObject, etc. */
export const minioClient = createMinioClient(env.S3_ENDPOINT);

/**
 * Endpoint embedded in presigned URLs (browser-reachable).
 * Must match the host clients use when following the link — do not rewrite signed URLs.
 */
export const minioPresignedClient = createMinioClient(env.S3_PUBLIC_ENDPOINT ?? env.S3_ENDPOINT);

export const attachmentsBucket = env.S3_BUCKET;
