jest.mock("../../../src/config/prismaClient");

import { prisma } from "../../../src/config/prismaClient";
import { AttachmentRepository } from "../../../src/repositories/impl/AttachmentRepository";
import { AbortError } from "../../../src/utils/errors/ClientErrors";

describe("AttachmentRepository", () => {
  let repo: AttachmentRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new AttachmentRepository();
  });

  describe("коректність", () => {
    it("findByTransactionId: where з transactionId та isDeleted: false", async () => {
      (prisma.attachment.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findByTransactionId("tx-1");

      expect(prisma.attachment.findMany).toHaveBeenCalledWith({
        where: { transactionId: "tx-1", isDeleted: false },
      });
    });

    it("upsert прокидає параметри в Prisma", async () => {
      const row = { id: "a1", transactionId: "tx" };
      (prisma.attachment.upsert as jest.Mock).mockResolvedValue(row);

      const params = {
        where: { id: "a1" },
        create: {
          transactionId: "tx",
          storageKey: "k",
          mimeType: "image/png",
          originalName: "f.png",
        },
        update: { originalName: "g.png" },
      };

      await expect(repo.upsert(params)).resolves.toEqual(row);
      expect(prisma.attachment.upsert).toHaveBeenCalledWith(params);
    });

    it("findById з базового шару використовує isDeleted: false", async () => {
      (prisma.attachment.findUnique as jest.Mock).mockResolvedValue(null);

      await repo.findById("att-1");

      expect(prisma.attachment.findUnique).toHaveBeenCalledWith({
        where: { id: "att-1", isDeleted: false },
      });
    });
  });

  describe("стійкість до зловмисних / крайніх вхідних даних", () => {
    it("findByTransactionId: підозрілий id лишається скалярним фільтром", async () => {
      const malicious = "../../../etc/passwd";
      (prisma.attachment.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findByTransactionId(malicious);

      expect(prisma.attachment.findMany).toHaveBeenCalledWith({
        where: { transactionId: malicious, isDeleted: false },
      });
    });

    it("upsert з перерваним signal — AbortError (upsert викликається при обчисленні аргументів)", async () => {
      const ac = new AbortController();
      ac.abort();
      (prisma.attachment.upsert as jest.Mock).mockResolvedValue({ id: "x" });

      await expect(
        repo.upsert(
          {
            where: { id: "x" },
            create: {
              transactionId: "t",
              storageKey: "s",
              mimeType: "application/octet-stream",
              originalName: "x.bin",
            },
            update: {},
          },
          { signal: ac.signal },
        ),
      ).rejects.toThrow(AbortError);

      expect(prisma.attachment.upsert).toHaveBeenCalledTimes(1);
    });
  });
});
