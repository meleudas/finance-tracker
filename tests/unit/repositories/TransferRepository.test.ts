jest.mock("../../../src/config/prismaClient");

import { prisma } from "../../../src/config/prismaClient";
import { TransferRepository } from "../../../src/repositories/impl/TransferRepository";
import { AbortError } from "../../../src/utils/errors/ClientErrors";

describe("TransferRepository", () => {
  let repo: TransferRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new TransferRepository();
  });

  describe("коректність", () => {
    it("findByUserId: where, пагінація та сортування", async () => {
      (prisma.transfer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transfer.count as jest.Mock).mockResolvedValue(0);

      await repo.findByUserId("user-1", { page: 2, limit: 15 });

      expect(prisma.transfer.findMany).toHaveBeenCalledWith({
        where: { userId: "user-1", isDeleted: false },
        skip: 15,
        take: 15,
        orderBy: { occurredAt: "desc" },
      });
      expect(prisma.transfer.count).toHaveBeenCalledWith({
        where: { userId: "user-1", isDeleted: false },
      });
    });

    it("findByFilter: додає фільтри за рахунками та датами", async () => {
      (prisma.transfer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transfer.count as jest.Mock).mockResolvedValue(0);
      const from = new Date("2025-01-01T00:00:00.000Z");
      const to = new Date("2025-12-31T23:59:59.000Z");

      await repo.findByFilter(
        {
          userId: "u1",
          fromAccountId: "acc-from",
          toAccountId: "acc-to",
          from,
          to,
        },
        { page: 1, limit: 20 },
      );

      expect(prisma.transfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "u1",
            isDeleted: false,
            fromAccountId: "acc-from",
            toAccountId: "acc-to",
            occurredAt: { gte: from, lte: to },
          },
        }),
      );
    });

    it("findByFilter: accountId додає OR між from та to", async () => {
      (prisma.transfer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transfer.count as jest.Mock).mockResolvedValue(0);

      await repo.findByFilter({ userId: "u1", accountId: "acc-x" }, { page: 1, limit: 20 });

      expect(prisma.transfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            userId: "u1",
            isDeleted: false,
            OR: [{ fromAccountId: "acc-x" }, { toAccountId: "acc-x" }],
          },
        }),
      );
    });

    it("findByAccountId: OR між from та to", async () => {
      (prisma.transfer.findMany as jest.Mock).mockResolvedValue([]);

      await repo.findByAccountId("acc-x");

      expect(prisma.transfer.findMany).toHaveBeenCalledWith({
        where: {
          isDeleted: false,
          OR: [{ fromAccountId: "acc-x" }, { toAccountId: "acc-x" }],
        },
        orderBy: { occurredAt: "desc" },
      });
    });
  });

  describe("стійкість до зловмисних / крайніх вхідних даних", () => {
    it("findByUserId: надмірний limit обрізається до 100", async () => {
      (prisma.transfer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transfer.count as jest.Mock).mockResolvedValue(0);

      await repo.findByUserId("u", { page: 1, limit: 1_000_000 });

      expect(prisma.transfer.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 100 }));
    });

    it("findByUserId: userId з injection-подібним рядком лишається рівністю в where", async () => {
      const injectionAttempt = "admin'--";
      (prisma.transfer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transfer.count as jest.Mock).mockResolvedValue(0);

      await repo.findByUserId(injectionAttempt, { page: 1, limit: 10 });

      expect(prisma.transfer.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: injectionAttempt, isDeleted: false },
        }),
      );
    });

    it("findByFilter: від'ємна сторінка нормалізується до 1 (skip = 0)", async () => {
      (prisma.transfer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transfer.count as jest.Mock).mockResolvedValue(0);

      await repo.findByFilter({ userId: "u" }, { page: -99, limit: 10 });

      expect(prisma.transfer.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });

    it("перерваний запит кидає AbortError (Prisma уже викликано через Promise.all)", async () => {
      const ac = new AbortController();
      ac.abort();
      (prisma.transfer.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.transfer.count as jest.Mock).mockResolvedValue(0);

      await expect(
        repo.findByUserId("u", { page: 1, limit: 10 }, { signal: ac.signal }),
      ).rejects.toThrow(AbortError);
      expect(prisma.transfer.findMany).toHaveBeenCalled();
      expect(prisma.transfer.count).toHaveBeenCalled();
    });
  });
});
