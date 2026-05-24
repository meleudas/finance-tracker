import type { IFileStorage } from "../../src/storage/IFileStorage";
import type { ICache } from "../../src/redis";

export function createMockFileStorage(
  overrides: Partial<jest.Mocked<IFileStorage>> = {},
): jest.Mocked<IFileStorage> {
  return {
    ensureBucketExists: jest.fn().mockResolvedValue(undefined),
    uploadFile: jest.fn().mockResolvedValue("storage/key"),
    downloadFile: jest.fn().mockResolvedValue(Buffer.from("file")),
    deleteFile: jest.fn().mockResolvedValue(undefined),
    getPresignedDownloadUrl: jest.fn().mockResolvedValue("https://example.com/dl"),
    getPresignedUploadUrl: jest.fn().mockResolvedValue("https://example.com/ul"),
    ...overrides,
  } as jest.Mocked<IFileStorage>;
}

export function createMockCache(overrides: Partial<jest.Mocked<ICache>> = {}): jest.Mocked<ICache> {
  return {
    getJson: jest.fn().mockResolvedValue(null),
    setJson: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue(undefined),
    keys: jest.fn().mockResolvedValue([]),
    ...overrides,
  } as jest.Mocked<ICache>;
}

export function createMockReportQueue(
  addImpl: () => Promise<unknown> = () => Promise.resolve({ id: "1" }),
) {
  return {
    add: jest.fn().mockImplementation(addImpl),
    close: jest.fn().mockResolvedValue(undefined),
  };
}
