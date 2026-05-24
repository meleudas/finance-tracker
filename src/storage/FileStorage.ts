import type { Readable } from "node:stream";
import type { IFileStorage } from "./IFileStorage";
import { minioClient, minioPresignedClient, attachmentsBucket } from "../config/minioConfig";
import { env } from "../config/env";
import { rethrowStorageError } from "./storageErrors";

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
  private readonly presignedClient = minioPresignedClient;

  async ensureBucketExists(): Promise<void> {
    try {
      const exists = await this.client.bucketExists(this.bucket);
      if (!exists) {
        await this.client.makeBucket(this.bucket, env.S3_REGION);
      }
    } catch (err) {
      rethrowStorageError(err);
    }
  }

  async uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string> {
    try {
      await this.ensureBucketExists();

      await this.client.putObject(this.bucket, key, buffer, buffer.length, {
        "Content-Type": mimeType,
      });
      return key;
    } catch (err) {
      rethrowStorageError(err);
    }
  }

  async downloadFile(key: string): Promise<Buffer> {
    try {
      const stream = await this.client.getObject(this.bucket, key);
      return await readableToBuffer(stream);
    } catch (err) {
      rethrowStorageError(err);
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.client.removeObject(this.bucket, key);
    } catch (err) {
      rethrowStorageError(err);
    }
  }

  async getPresignedDownloadUrl(
    key: string,
    expiresInSeconds = env.S3_PRESIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    try {
      const url = await this.presignedClient.presignedGetObject(this.bucket, key, expiresInSeconds);
      return url;
    } catch (err) {
      rethrowStorageError(err);
    }
  }

  async getPresignedUploadUrl(
    key: string,
    expiresInSeconds = env.S3_PRESIGNED_URL_EXPIRY_SECONDS,
  ): Promise<string> {
    try {
      const url = await this.presignedClient.presignedPutObject(this.bucket, key, expiresInSeconds);
      return url;
    } catch (err) {
      rethrowStorageError(err);
    }
  }
}
