import { BudgetService } from "../../../src/services/impl/BudgetService";

interface MockPrismaTx {
  account: { findUnique: jest.Mock };
  category: { findUnique: jest.Mock };
  budget: {
    findFirst: jest.Mock;
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    findMany: jest.Mock;
  };
  transaction: { aggregate: jest.Mock };
}

const mockPrismaTx: MockPrismaTx = {
  account: { findUnique: jest.fn() },
  category: { findUnique: jest.fn() },
  budget: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    findMany: jest.fn(),
  },
  transaction: { aggregate: jest.fn() },
};

jest.mock("../../../src/config/prismaClient", () => ({
  prisma: {
    $transaction: jest.fn((callback: (tx: unknown) => Promise<unknown>) => callback(mockPrismaTx)),
    account: {
      findUnique: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.account.findUnique(args)),
      ),
    },
    category: {
      findUnique: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.category.findUnique(args)),
      ),
    },
    budget: {
      findFirst: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.budget.findFirst(args)),
      ),
      create: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.budget.create(args)),
      ),
      findUnique: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.budget.findUnique(args)),
      ),
      update: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.budget.update(args)),
      ),
      findMany: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.budget.findMany(args)),
      ),
    },
    transaction: {
      aggregate: jest.fn(
        async (args: unknown): Promise<unknown> =>
          Promise.resolve(mockPrismaTx.transaction.aggregate(args)),
      ),
    },
  },
}));

describe("BudgetService - Unit Tests", () => {
  let budgetService: BudgetService;
  const userId = "user_cl9123abc";

  beforeEach(() => {
    jest.clearAllMocks();
    budgetService = new BudgetService();
  });

  describe("createBudget", () => {
    const validDto = {
      userId,
      accountId: "acc_123",
      currencyId: "cur_uah",
      categoryId: "cat_expense_123",
      name: "Бюджет на продукти",
      periodStart: new Date("2026-05-01"),
      periodEnd: new Date("2026-05-31"),
      limitAmount: 5000,
    };

    it("має успішно створити бюджет за умови виконання всіх лімітів та інваріантів", async () => {
      mockPrismaTx.account.findUnique.mockResolvedValue({
        id: "acc_123",
        userId,
        currencyId: "cur_uah",
        isDeleted: false,
        currency: { code: "UAH" },
      });

      mockPrismaTx.category.findUnique.mockResolvedValue({
        id: "cat_expense_123",
        userId,
        kind: "EXPENSE",
        isDeleted: false,
      });

      mockPrismaTx.budget.findFirst.mockResolvedValue(null);

      mockPrismaTx.budget.create.mockResolvedValue({ id: "bud_777", ...validDto });

      const result = await budgetService.createBudget(validDto);

      expect(result.id).toBe("bud_777");
      expect(mockPrismaTx.budget.create).toHaveBeenCalled();
    });

    it("має викинути помилку, якщо дата початку пізніша або дорівнює даті кінця", async () => {
      const invalidPeriodDto = {
        ...validDto,
        periodStart: new Date("2026-05-31"),
        periodEnd: new Date("2026-05-01"),
      };

      await expect(budgetService.createBudget(invalidPeriodDto)).rejects.toThrow(
        "Start date must be before end date",
      );
    });

    it("має викинути помилку, якщо рахунок не знайдено або він належить іншому юзеру", async () => {
      mockPrismaTx.account.findUnique.mockResolvedValue(null);

      await expect(budgetService.createBudget(validDto)).rejects.toThrow("Account not found");
    });

    it("має викинути помилку, якщо валюта рахунку не збігається з валютою ліміту", async () => {
      mockPrismaTx.account.findUnique.mockResolvedValue({
        id: "acc_123",
        userId,
        currencyId: "cur_usd",
        isDeleted: false,
      });

      await expect(budgetService.createBudget(validDto)).rejects.toThrow(
        "Budget currency must match the account currency",
      );
    });

    it("має викинути помилку, якщо ліміт ставиться на дохідну категорію (INCOME)", async () => {
      mockPrismaTx.account.findUnique.mockResolvedValue({
        id: "acc_123",
        userId,
        currencyId: "cur_uah",
        isDeleted: false,
      });
      mockPrismaTx.category.findUnique.mockResolvedValue({
        id: "cat_income_123",
        userId,
        kind: "INCOME",
        isDeleted: false,
      });

      await expect(budgetService.createBudget(validDto)).rejects.toThrow(
        "Budgets can only be set for expense categories",
      );
    });

    it("має викинути помилку, якщо сума ліміту є нульовою або від'ємною", async () => {
      mockPrismaTx.account.findUnique.mockResolvedValue({
        id: "acc_123",
        userId,
        currencyId: "cur_uah",
        isDeleted: false,
      });
      mockPrismaTx.category.findUnique.mockResolvedValue({
        id: "cat_expense_123",
        userId,
        kind: "EXPENSE",
        isDeleted: false,
      });

      const zeroAmountDto = { ...validDto, limitAmount: 0 };

      await expect(budgetService.createBudget(zeroAmountDto)).rejects.toThrow(
        "Limit amount must be greater than zero",
      );
    });

    it("має викинути помилку, якщо на цей час вже є активний ліміт", async () => {
      mockPrismaTx.account.findUnique.mockResolvedValue({
        id: "acc_123",
        userId,
        currencyId: "cur_uah",
        isDeleted: false,
      });
      mockPrismaTx.category.findUnique.mockResolvedValue({
        id: "cat_expense_123",
        userId,
        kind: "EXPENSE",
        isDeleted: false,
      });
      mockPrismaTx.budget.findFirst.mockResolvedValue({ id: "bud_existing" });

      await expect(budgetService.createBudget(validDto)).rejects.toThrow(
        "An active budget already overlaps with this period",
      );
    });

    it("має викинути помилку при спробі оновити чужий або софт-делітнутий бюджет", async () => {
      mockPrismaTx.budget.findUnique.mockResolvedValue(null);

      await expect(
        budgetService.updateBudgetLimit(userId, "bud_invalid", { limitAmount: 2000 }),
      ).rejects.toThrow("Budget not found");
    });

    describe("getBudgetsProgress", () => {
      it("має розрахувати факт витрат, залишок та прапорець перевищення ліміту", async () => {
        const targetDate = new Date("2026-05-15");

        mockPrismaTx.budget.findMany.mockResolvedValue([
          {
            id: "bud_active",
            name: "Транспортний ліміт",
            limitAmount: 1000,
            periodStart: new Date("2026-05-01"),
            periodEnd: new Date("2026-05-31"),
            accountId: "acc_card",
            categoryId: "cat_fuel",
            currency: { code: "EUR" },
          },
        ]);

        // Імітуємо агрегацію сум витрат з бази даних (юзер витратив 1200 EUR)
        mockPrismaTx.transaction.aggregate.mockResolvedValue({
          _sum: { amount: 1200 },
        });

        const progress = await budgetService.getBudgetsProgress(userId, targetDate);

        expect(progress).toHaveLength(1);
        const report = progress[0];

        expect(report?.spentAmount).toBe(1200);
        expect(report?.remainingAmount).toBe(0); // Залишок не може бути меншим за 0
        expect(report?.isExceeded).toBe(true); // Ліміт у 1000 перевищено витратою у 1200
        expect(report?.currencyCode).toBe("EUR");
      });

      it("має повернути порожній масив, якщо на вказану дату немає активних планів", async () => {
        mockPrismaTx.budget.findMany.mockResolvedValue([]);

        const progress = await budgetService.getBudgetsProgress(userId, new Date());
        expect(progress).toHaveLength(0);
      });
    });
  });
});
