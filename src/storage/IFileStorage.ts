export interface IFileStorage {
  /** Ensures the configured attachments bucket exists. */
  ensureBucketExists(): Promise<void>;

  /** Upload via API (multipart → buffer → putObject). Returns storage key. */
  uploadFile(key: string, buffer: Buffer, mimeType: string): Promise<string>;

  /** Stream file through backend (proxy download). */
  downloadFile(key: string): Promise<Buffer>;

  deleteFile(key: string): Promise<void>;

  /**
   * Temporary GET URL for private bucket (ADR 0004 — generated on read, not stored in DB).
   */
  getPresignedDownloadUrl(key: string, expiresInSeconds?: number): Promise<string>;

  /**
   * Temporary PUT URL for direct client upload (optional flow, v2).
   */
  getPresignedUploadUrl(key: string, expiresInSeconds?: number): Promise<string>;
}
