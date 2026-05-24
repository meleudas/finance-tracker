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
    it("throws ValidationError for empty buffer", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);

      await expect(
        service.uploadAttachment(
          {
            originalName: "empty.pdf",
            mimeType: "application/pdf",
            buffer: Buffer.alloc(0),
          },
          { transactionId },
          { id: userId },
        ),
      ).rejects.toThrow(ValidationError);
    });

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

  describe("getPresignedUploadUrl", () => {
    it("returns upload url and storage key", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);

      const result = await service.getPresignedUploadUrl(
        { originalName: "receipt.pdf", mimeType: "application/pdf" },
        { transactionId },
        { id: userId },
      );

      expect(result.storageKey).toMatch(new RegExp(`^attachments/${userId}/`));
      expect(result.uploadUrl).toBe("https://upload.example/url");
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

  describe("updateAttachment", () => {
    it("updates attachment metadata", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);
      attachmentRepo.findById.mockResolvedValue(makeAttachment());
      attachmentRepo.update.mockResolvedValue(makeAttachment({ originalName: "new.pdf" }));

      const result = await service.updateAttachment(
        { originalName: "new.pdf" },
        { transactionId, id: attachmentId },
        { id: userId },
      );

      expect(result.originalName).toBe("new.pdf");
      expect(cache.keys).toHaveBeenCalled();
    });
  });

  describe("getAttachment", () => {
    it("returns cached attachment with download url", async () => {
      const cached = { id: attachmentId, downloadUrl: "https://cached" };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getAttachment(
        { transactionId, id: attachmentId },
        { id: userId },
      );

      expect(result).toEqual(cached);
    });

    it("loads attachment and caches download url", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);
      attachmentRepo.findById.mockResolvedValue(makeAttachment());

      const result = await service.getAttachment(
        { transactionId, id: attachmentId },
        { id: userId },
      );

      expect(result.downloadUrl).toBe("https://download.example/url");
      expect(cache.setJson).toHaveBeenCalled();
    });

    it("throws NotFoundError when attachment belongs to another transaction", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);
      attachmentRepo.findById.mockResolvedValue(
        makeAttachment({ transactionId: "clothertransaction00000001" }),
      );

      await expect(
        service.getAttachment({ transactionId, id: attachmentId }, { id: userId }),
      ).rejects.toThrow(NotFoundError);
    });

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

  describe("getAttachmentDownloadUrl", () => {
    it("returns cached download url", async () => {
      const cached = { downloadUrl: "https://cached", expiresInSeconds: 900 };
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getAttachmentDownloadUrl(
        { transactionId, id: attachmentId },
        { id: userId },
      );

      expect(result).toEqual(cached);
    });

    it("generates and caches presigned download url", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);
      attachmentRepo.findById.mockResolvedValue(makeAttachment());

      const result = await service.getAttachmentDownloadUrl(
        { transactionId, id: attachmentId },
        { id: userId },
      );

      expect(result.downloadUrl).toBe("https://download.example/url");
      expect(cache.setJson).toHaveBeenCalled();
    });
  });

  describe("getAttachments", () => {
    it("returns cached attachment list", async () => {
      const cached = [{ id: attachmentId, downloadUrl: "https://cached" }];
      cache.getJson.mockResolvedValueOnce(cached);

      const result = await service.getAttachments({ transactionId }, { id: userId });

      expect(result).toEqual(cached);
    });

    it("loads attachments with download urls", async () => {
      transactionRepo.findById.mockResolvedValue({
        id: transactionId,
        userId,
      } as Awaited<ReturnType<ITransactionRepository["findById"]>>);
      attachmentRepo.findByTransactionId.mockResolvedValue([makeAttachment()]);

      const result = await service.getAttachments({ transactionId }, { id: userId });

      expect(result).toHaveLength(1);
      expect(result[0]?.downloadUrl).toBe("https://download.example/url");
    });

    it("throws NotFoundError when transaction not found for user", async () => {
      transactionRepo.findById.mockResolvedValue(null);

      await expect(service.getAttachments({ transactionId }, { id: userId })).rejects.toThrow(
        NotFoundError,
      );
    });
  });
});
