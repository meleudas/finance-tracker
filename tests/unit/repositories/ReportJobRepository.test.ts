jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    reportJob: {
      create: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

import { prisma } from "../../../src/config/prismaClient";
import { ReportJobRepository } from "../../../src/repositories/impl/ReportJobRepository";
import { AbortError } from "../../../src/utils/errors/ClientErrors";

describe("ReportJobRepository", () => {
  let repo: ReportJobRepository;
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const jobId = "clk7v9x1k0000qzq8x8x8x8xb";

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new ReportJobRepository();
  });

  const createInput = {
    userId,
    format: "PDF" as const,
    from: new Date("2026-01-01T00:00:00.000Z"),
    to: new Date("2026-01-31T23:59:59.999Z"),
    includeRecurring: true,
  };

  describe("create", () => {
    it("створює job зі статусом PENDING", async () => {
      const created = { id: jobId, status: "PENDING" };
      (prisma.reportJob.create as jest.Mock).mockResolvedValue(created);

      const result = await repo.create(createInput);

      expect(result).toEqual(created);
      expect(prisma.reportJob.create).toHaveBeenCalledWith({
        data: {
          userId,
          format: "PDF",
          from: createInput.from,
          to: createInput.to,
          accountId: null,
          includeRecurring: true,
          status: "PENDING",
        },
      });
    });

    it("передає accountId, якщо задано", async () => {
      (prisma.reportJob.create as jest.Mock).mockResolvedValue({ id: jobId });

      await repo.create({ ...createInput, accountId: "clm7v9x1k0000qzq8x8x8x8xc" });

      expect(prisma.reportJob.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ accountId: "clm7v9x1k0000qzq8x8x8x8xc" }),
        }),
      );
    });
  });

  describe("abort signal", () => {
    it("create кидає AbortError", async () => {
      const ac = new AbortController();
      ac.abort();
      (prisma.reportJob.create as jest.Mock).mockResolvedValue({ id: jobId });
      await expect(repo.create(createInput, { signal: ac.signal })).rejects.toThrow(AbortError);
    });

    it("findByIdForUser кидає AbortError", async () => {
      const ac = new AbortController();
      ac.abort();
      (prisma.reportJob.findFirst as jest.Mock).mockResolvedValue(null);
      await expect(repo.findByIdForUser(jobId, userId, { signal: ac.signal })).rejects.toThrow(
        AbortError,
      );
    });

    it("update кидає AbortError", async () => {
      const ac = new AbortController();
      ac.abort();
      (prisma.reportJob.update as jest.Mock).mockResolvedValue({ id: jobId });
      await expect(repo.update(jobId, { status: "FAILED" }, { signal: ac.signal })).rejects.toThrow(
        AbortError,
      );
    });
  });

  describe("findByIdForUser", () => {
    it("шукає за id та userId", async () => {
      (prisma.reportJob.findFirst as jest.Mock).mockResolvedValue(null);

      await repo.findByIdForUser(jobId, userId);

      expect(prisma.reportJob.findFirst).toHaveBeenCalledWith({
        where: { id: jobId, userId },
      });
    });
  });

  describe("update", () => {
    it("оновлює job за id", async () => {
      const updated = { id: jobId, status: "COMPLETED" };
      (prisma.reportJob.update as jest.Mock).mockResolvedValue(updated);

      const result = await repo.update(jobId, { status: "COMPLETED" });

      expect(result).toEqual(updated);
      expect(prisma.reportJob.update).toHaveBeenCalledWith({
        where: { id: jobId },
        data: { status: "COMPLETED" },
      });
    });
  });

  describe("delete", () => {
    it("видаляє job за id", async () => {
      (prisma.reportJob.delete as jest.Mock).mockResolvedValue({ id: jobId });

      await repo.delete(jobId);

      expect(prisma.reportJob.delete).toHaveBeenCalledWith({ where: { id: jobId } });
    });

    it("кидає AbortError при перерваному signal", async () => {
      const ac = new AbortController();
      ac.abort();

      await expect(repo.delete(jobId, { signal: ac.signal })).rejects.toThrow(AbortError);
    });
  });
});
