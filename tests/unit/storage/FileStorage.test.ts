import { Readable } from "node:stream";
import { ServiceUnavailableError } from "../../../src/utils/errors/serverErrors";
import { ValidationError } from "../../../src/utils/errors/ClientErrors";

const mockClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  putObject: jest.fn(),
  getObject: jest.fn(),
  removeObject: jest.fn(),
};

const mockPresignedClient = {
  presignedGetObject: jest.fn(),
  presignedPutObject: jest.fn(),
};

jest.mock("../../../src/config/minioConfig", () => ({
  minioClient: mockClient,
  minioPresignedClient: mockPresignedClient,
  attachmentsBucket: "test-bucket",
}));

jest.mock("../../../src/config/env", () => ({
  env: {
    S3_REGION: "us-east-1",
    S3_PRESIGNED_URL_EXPIRY_SECONDS: 900,
    S3_ENDPOINT: "http://minio:9000",
    S3_PUBLIC_ENDPOINT: "http://localhost:9000",
  },
}));

import { FileStorage } from "../../../src/storage/FileStorage";

describe("FileStorage", () => {
  let storage: FileStorage;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = new FileStorage();
  });

  it("creates bucket when missing then uploads", async () => {
    mockClient.bucketExists.mockResolvedValue(false);
    mockClient.makeBucket.mockResolvedValue(undefined);
    mockClient.putObject.mockResolvedValue(undefined);

    const key = await storage.uploadFile("k1", Buffer.from("data"), "text/plain");

    expect(key).toBe("k1");
    expect(mockClient.makeBucket).toHaveBeenCalledWith("test-bucket", "us-east-1");
    expect(mockClient.putObject).toHaveBeenCalled();
  });

  it("skips makeBucket when bucket exists", async () => {
    mockClient.bucketExists.mockResolvedValue(true);
    mockClient.putObject.mockResolvedValue(undefined);

    await storage.uploadFile("k2", Buffer.from("x"), "application/pdf");

    expect(mockClient.makeBucket).not.toHaveBeenCalled();
  });

  it("downloads file via stream", async () => {
    const stream = Readable.from([Buffer.from("hello"), Buffer.from(" world")]);
    mockClient.getObject.mockResolvedValue(stream);

    const buf = await storage.downloadFile("k3");

    expect(buf.toString()).toBe("hello world");
  });

  it("deletes object", async () => {
    mockClient.removeObject.mockResolvedValue(undefined);
    await storage.deleteFile("k4");
    expect(mockClient.removeObject).toHaveBeenCalledWith("test-bucket", "k4");
  });

  it("returns presigned URLs from the public-endpoint client", async () => {
    mockPresignedClient.presignedGetObject.mockResolvedValue(
      "http://localhost:9000/test-bucket/k5?sig=1",
    );
    mockPresignedClient.presignedPutObject.mockResolvedValue(
      "http://localhost:9000/test-bucket/k6?sig=2",
    );

    await expect(storage.getPresignedDownloadUrl("k5")).resolves.toBe(
      "http://localhost:9000/test-bucket/k5?sig=1",
    );
    await expect(storage.getPresignedUploadUrl("k6", 120)).resolves.toBe(
      "http://localhost:9000/test-bucket/k6?sig=2",
    );
    expect(mockPresignedClient.presignedGetObject).toHaveBeenCalledWith("test-bucket", "k5", 900);
    expect(mockPresignedClient.presignedPutObject).toHaveBeenCalledWith("test-bucket", "k6", 120);
  });

  it("maps MinIO errors to ServiceUnavailableError", async () => {
    mockClient.bucketExists.mockRejectedValue(new Error("down"));
    await expect(storage.ensureBucketExists()).rejects.toThrow(ServiceUnavailableError);
  });

  it("rethrows AppError from storage layer", async () => {
    mockClient.bucketExists.mockRejectedValue(new ValidationError("forbidden"));
    await expect(storage.ensureBucketExists()).rejects.toThrow(ValidationError);
  });

  it("maps upload errors to ServiceUnavailableError", async () => {
    mockClient.bucketExists.mockResolvedValue(true);
    mockClient.putObject.mockRejectedValue(new Error("upload failed"));
    await expect(storage.uploadFile("k", Buffer.from("x"), "text/plain")).rejects.toThrow(
      ServiceUnavailableError,
    );
  });

  it("maps download errors to ServiceUnavailableError", async () => {
    mockClient.getObject.mockRejectedValue(new Error("missing"));
    await expect(storage.downloadFile("k")).rejects.toThrow(ServiceUnavailableError);
  });

  it("maps delete errors to ServiceUnavailableError", async () => {
    mockClient.removeObject.mockRejectedValue(new Error("denied"));
    await expect(storage.deleteFile("k")).rejects.toThrow(ServiceUnavailableError);
  });

  it("maps presigned GET errors to ServiceUnavailableError", async () => {
    mockPresignedClient.presignedGetObject.mockRejectedValue(new Error("sign fail"));
    await expect(storage.getPresignedDownloadUrl("k")).rejects.toThrow(ServiceUnavailableError);
  });

  it("maps presigned PUT errors to ServiceUnavailableError", async () => {
    mockPresignedClient.presignedPutObject.mockRejectedValue(new Error("sign fail"));
    await expect(storage.getPresignedUploadUrl("k")).rejects.toThrow(ServiceUnavailableError);
  });

  it("converts non-buffer stream chunks to buffers", async () => {
    const stream = Readable.from([new Uint8Array([65, 66])]);
    mockClient.getObject.mockResolvedValue(stream);
    await expect(storage.downloadFile("k")).resolves.toEqual(Buffer.from("AB"));
  });
});
