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

const s3Endpoint = parseS3Endpoint(env.S3_ENDPOINT);

export const minioClient = new Client({
  endPoint: s3Endpoint.endPoint,
  port: s3Endpoint.port,
  useSSL: s3Endpoint.useSSL,
  accessKey: env.S3_ACCESS_KEY_ID,
  secretKey: env.S3_SECRET_ACCESS_KEY,
  region: env.S3_REGION,
});

export const attachmentsBucket = env.S3_BUCKET;
