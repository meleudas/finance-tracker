import type { Readable } from "node:stream";
import type { IFileStorage } from "./IFileStorage";
import { minioClient, attachmentsBucket } from "../config/minioConfig";
import { env } from "../config/env";

async function readableToBuffer(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array));
  }
  return Buffer.concat(chunks);
}

export class FileStorage implements IFileStorage {
  private readonly bucket = attachmentsBucket;
  private readonly client = minioClient;

  async ensureBucketExists(): Promise<void> {
    const exists = await this.client.bucketExists(this.bucket);
    if (!exists) {
      await this.client.makeBucket(this.bucket, env.S3_REGION);
    }
  }

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    await this.ensureBucketExists();

    await this.client.putObject(this.bucket, key, buffer, buffer.length, {
      "Content-Type": mimeType,
    });
    return key;
  }

  async downloadFile(key: string): Promise<Buffer> {
    const stream = await this.client.getObject(this.bucket, key);
    return readableToBuffer(stream);
  }

  async deleteFile(key: string): Promise<void> {
    await this.client.removeObject(this.bucket, key);
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresInSeconds = env.S3_PRESIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    return this.client.presignedGetObject(this.bucket, key, expiresInSeconds);
  }

  async getPresignedUploadUrl(
    key: string,
    expiresInSeconds = env.S3_PRESIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    return this.client.presignedPutObject(this.bucket, key, expiresInSeconds);
  }
}
