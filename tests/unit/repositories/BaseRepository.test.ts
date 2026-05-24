jest.mock("../../../src/config/prismaClient");

import { BaseRepository, type PrismaDelegate } from "../../../src/repositories/impl/BaseRepository";
import { AbortError } from "../../../src/utils/errors/ClientErrors";

interface TestEntity {
  id: string;
  name: string;
}

class TestRepository extends BaseRepository<TestEntity> {
  public readonly delegateMock: PrismaDelegate = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  protected get delegate(): PrismaDelegate {
    return this.delegateMock;
  }
}

describe("BaseRepository", () => {
  let repo: TestRepository;

  beforeEach(() => {
    jest.clearAllMocks();
    repo = new TestRepository();
  });

  describe("коректність", () => {
    it("findById передає id та isDeleted: false", async () => {
      (repo.delegateMock.findUnique as jest.Mock).mockResolvedValue({
        id: "a1",
        name: "x",
      });

      await repo.findById("a1");

      expect(repo.delegateMock.findUnique).toHaveBeenCalledWith({
        where: { id: "a1", isDeleted: false },
      });
    });

    it("findMany рахує skip/take від сторінки та ліміту", async () => {
      (repo.delegateMock.findMany as jest.Mock).mockResolvedValue([]);
      (repo.delegateMock.count as jest.Mock).mockResolvedValue(42);

      const result = await repo.findMany({ page: 3, limit: 10 });

      expect(repo.delegateMock.findMany).toHaveBeenCalledWith({
        where: { isDeleted: false },
        skip: 20,
        take: 10,
      });
      expect(repo.delegateMock.count).toHaveBeenCalledWith({
        where: { isDeleted: false },
      });
      expect(result).toEqual({
        data: [],
        total: 42,
        page: 3,
        limit: 10,
        totalPages: 5,
      });
    });

    it("update додає isDeleted: false до where", async () => {
      (repo.delegateMock.update as jest.Mock).mockResolvedValue({
        id: "u1",
        name: "n",
      });

      await repo.update("u1", { name: "n" });

      expect(repo.delegateMock.update).toHaveBeenCalledWith({
        where: { id: "u1", isDeleted: false },
        data: { name: "n" },
      });
    });

    it("softDelete викликає delete з where лише за id (розширення soft-delete)", async () => {
      (repo.delegateMock.delete as jest.Mock).mockResolvedValue({ id: "d1" });

      await repo.softDelete("d1");

      expect(repo.delegateMock.delete).toHaveBeenCalledWith({
        where: { id: "d1" },
      });
    });

    it("exists повертає true коли count > 0", async () => {
      (repo.delegateMock.count as jest.Mock).mockResolvedValue(1);
      await expect(repo.exists("e1")).resolves.toBe(true);
    });

    it("exists повертає false коли count = 0", async () => {
      (repo.delegateMock.count as jest.Mock).mockResolvedValue(0);
      await expect(repo.exists("e1")).resolves.toBe(false);
    });

    it("findAll повертає активні записи", async () => {
      (repo.delegateMock.findMany as jest.Mock).mockResolvedValue([{ id: "a1" }]);
      await expect(repo.findAll()).resolves.toEqual([{ id: "a1" }]);
    });

    it("create делегує до prisma", async () => {
      (repo.delegateMock.create as jest.Mock).mockResolvedValue({ id: "c1" });
      await repo.create({ name: "x" });
      expect(repo.delegateMock.create).toHaveBeenCalledWith({ data: { name: "x" } });
    });

    it("count повертає кількість активних", async () => {
      (repo.delegateMock.count as jest.Mock).mockResolvedValue(3);
      await expect(repo.count()).resolves.toBe(3);
    });
  });

  describe("стійкість до зловмисних / крайніх вхідних даних", () => {
    it("findById: id з SQL-подібним рядком передається як літерал у where (параметризація Prisma)", async () => {
      const malicious = "x' OR 1=1;--";
      (repo.delegateMock.findUnique as jest.Mock).mockResolvedValue(null);

      await repo.findById(malicious);

      expect(repo.delegateMock.findUnique).toHaveBeenCalledWith({
        where: { id: malicious, isDeleted: false },
      });
    });

    it("findMany: limit > 100 обрізається до 100", async () => {
      (repo.delegateMock.findMany as jest.Mock).mockResolvedValue([]);
      (repo.delegateMock.count as jest.Mock).mockResolvedValue(0);

      await repo.findMany({ page: 1, limit: 999_999 });

      expect(repo.delegateMock.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ take: 100 }),
      );
    });

    it("findMany: сторінка < 1 трактується як 1", async () => {
      (repo.delegateMock.findMany as jest.Mock).mockResolvedValue([]);
      (repo.delegateMock.count as jest.Mock).mockResolvedValue(0);

      await repo.findMany({ page: 0, limit: 10 });

      expect(repo.delegateMock.findMany).toHaveBeenCalledWith(expect.objectContaining({ skip: 0 }));
    });

    it("findMany: limit < 1 піднімається до 1", async () => {
      (repo.delegateMock.findMany as jest.Mock).mockResolvedValue([]);
      (repo.delegateMock.count as jest.Mock).mockResolvedValue(0);

      await repo.findMany({ page: 1, limit: -50 });

      expect(repo.delegateMock.findMany).toHaveBeenCalledWith(expect.objectContaining({ take: 1 }));
    });

    it("findAll/create/count відхиляються при aborted signal", async () => {
      const ac = new AbortController();
      ac.abort();
      (repo.delegateMock.findMany as jest.Mock).mockResolvedValue([]);
      (repo.delegateMock.create as jest.Mock).mockResolvedValue({ id: "c1" });
      (repo.delegateMock.count as jest.Mock).mockResolvedValue(0);

      await expect(repo.findAll({ signal: ac.signal })).rejects.toThrow(AbortError);
      await expect(repo.create({ name: "x" }, { signal: ac.signal })).rejects.toThrow(AbortError);
      await expect(repo.count({ signal: ac.signal })).rejects.toThrow(AbortError);
    });

    it("findById з уже перерваним AbortSignal відхиляється з AbortError", async () => {
      const ac = new AbortController();
      ac.abort();
      (repo.delegateMock.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(repo.findById("any", { signal: ac.signal })).rejects.toThrow(AbortError);
      // findUnique викликається під час побудови аргументів — до перевірки signal у withAbortSignal
      expect(repo.delegateMock.findUnique).toHaveBeenCalledWith({
        where: { id: "any", isDeleted: false },
      });
    });
  });
});
