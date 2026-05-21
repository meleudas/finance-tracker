import { AttachmentService } from "../../../src/services/impl/AttachmentService";
import type { IAttachmentRepository } from "../../../src/repositories/interfaces/IAttachmentRepository";
import type { ITransactionRepository } from "../../../src/repositories/interfaces/ITransactionRepository";
import type { IFileStorage } from "../../../src/storage/IFileStorage";
import type { ICache } from "../../../src/redis";
import { NotFoundError, ValidationError } from "../../../src/utils/errors/ClientErrors";
import type { Attachment } from "../../../src/generated/prisma/client";

describe("AttachmentService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const otherUserId = "cln7v9x1k0000qzq8x8x8x8x1";
  const transactionId = "clk7v9x1k0000qzq8x8x8x8xb";
  const attachmentId = "clm7v9x1k0000qzq8x8x8x8xc";

  let attachmentRepo: jest.Mocked<IAttachmentRepository>;
  let transactionRepo: jest.Mocked<ITransactionRepository>;
  let fileStorage: jest.Mocked<IFileStorage>;
  let cache: jest.Mocked<ICache>;
  let service: AttachmentService;

  const makeAttachment = (overrides: Partial<Attachment> = {}): Attachment => ({
    id: attachmentId,
    transactionId,
    storageKey: `attachments/${userId}/file.pdf`,
    mimeType: "application/pdf",
    originalName: "receipt.pdf",
    createdAt: new Date("2026-05-01T00:00:00.000Z"),
    updatedAt: new Date("2026-05-01T00:00:00.000Z"),
    deletedAt: null,
    isDeleted: false,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    attachmentRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByTransactionId: jest.fn(),
      update: jest.fn(),
      softDelete: jest.fn(),
      upsert: jest.fn(),
    } as unknown as jest.Mocked<IAttachmentRepository>;

    transactionRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ITransactionRepository>;

    fileStorage = {
      uploadFile: jest.fn().mockResolvedValue("key"),
      deleteFile: jest.fn().mockResolvedValue(undefined),
      getPresignedDownloadUrl: jest.fn().mockResolvedValue("https://download.example/url"),
      getPresignedUploadUrl: jest.fn().mockResolvedValue("https://upload.example/url"),
    } as unknown as jest.Mocked<IFileStorage>;

    cache = {
      getJson: jest.fn().mockResolvedValue(null),
      setJson: jest.fn().mockResolvedValue(undefined),
      delete: jest.fn().mockResolvedValue(undefined),
      keys: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ICache>;

    service = new AttachmentService(attachmentRepo, transactionRepo, fileStorage, cache);
  });

  describe("uploadAttachment", () => {
    it("uploads file and returns attachment without storageKey", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);
      attachmentRepo.create.mockResolvedValue(makeAttachment());

      const result = await service.uploadAttachment(
        {
          originalName: "receipt.pdf",
          mimeType: "application/pdf",
          buffer: Buffer.from("pdf-content"),
        },
        { transactionId },
        { id: userId },
      );

      expect(fileStorage.uploadFile).toHaveBeenCalledWith(
        expect.stringMatching(new RegExp(`^attachments/${userId}/.+\\.pdf$`)),
        expect.any(Buffer),
        "application/pdf",
      );
      expect(attachmentRepo.create).toHaveBeenCalled();
      expect(result).not.toHaveProperty("storageKey");
      expect(result.id).toBe(attachmentId);
    });
  });

  describe("confirmPresignedUpload", () => {
    it("creates attachment when storageKey has valid user prefix", async () => {
      const storageKey = `attachments/${userId}/abc.pdf`;
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);
      attachmentRepo.create.mockResolvedValue(makeAttachment({ storageKey }));

      const result = await service.confirmPresignedUpload(
        {
          storageKey,
          originalName: "receipt.pdf",
          mimeType: "application/pdf",
        },
        { transactionId },
        { id: userId },
      );

      expect(attachmentRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({ storageKey, transactionId }),
        undefined,
      );
      expect(result).not.toHaveProperty("storageKey");
    });

    it("throws ValidationError when storageKey prefix does not match user", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);

      await expect(
        service.confirmPresignedUpload(
          {
            storageKey: `attachments/${otherUserId}/stolen.pdf`,
            originalName: "receipt.pdf",
            mimeType: "application/pdf",
          },
          { transactionId },
          { id: userId },
        ),
      ).rejects.toThrow(ValidationError);

      expect(attachmentRepo.create).not.toHaveBeenCalled();
    });
  });

  describe("getAttachment", () => {
    it("throws NotFoundError when transaction belongs to another user", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId: otherUserId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);

      await expect(
        service.getAttachment({ transactionId, id: attachmentId }, { id: userId }),
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe("deleteAttachment", () => {
    it("deletes file from storage after soft delete", async () => {
      const attachment = makeAttachment();
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);
      attachmentRepo.findById.mockResolvedValue(attachment);
      attachmentRepo.softDelete.mockResolvedValue(
        makeAttachment({
          deletedAt: new Date("2026-05-02T00:00:00.000Z"),
          isDeleted: true,
        }),
      );

      await service.deleteAttachment({ transactionId, id: attachmentId }, { id: userId });

      expect(fileStorage.deleteFile).toHaveBeenCalledWith(attachment.storageKey);
    });
  });

  describe("getAttachments", () => {
    it("throws NotFoundError when transaction not found for user", async () => {
      transactionRepo.findById.mockResolvedValue(null);

      await expect(service.getAttachments({ transactionId }, { id: userId })).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
