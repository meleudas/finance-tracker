import { ReportService } from "../../../src/services/impl/ReportService";
import type { IAccountRepository } from "../../../src/repositories/interfaces/IAccountRepository";
import type { ITransactionRepository } from "../../../src/repositories/interfaces/ITransactionRepository";
import type { ITransferRepository } from "../../../src/repositories/interfaces/ITransferRepository";
import type { IBudgetRepository } from "../../../src/repositories/interfaces/IBudgetRepository";
import type { ICategoryRepository } from "../../../src/repositories/interfaces/ICategoryRepository";
import type { ICurrencyRepository } from "../../../src/repositories/interfaces/ICurrencyRepository";
import type { IRecurringRuleRepository } from "../../../src/repositories/interfaces/IRecurringRuleRepository";
import type { RecurringRuleWithFrequency } from "../../../src/repositories/interfaces/IRecurringRuleRepository";
import { NotFoundError } from "../../../src/utils/errors/ClientErrors";

describe("ReportService", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";
  const accountId = "clk7v9x1k0000qzq8x8x8x8xb";
  const currencyId = "clm7v9x1k0000qzq8x8x8x8xc";
  const from = new Date("2026-05-01T00:00:00.000Z");
  const to = new Date("2026-05-31T23:59:59.999Z");

  let accountRepo: jest.Mocked<IAccountRepository>;
  let transactionRepo: jest.Mocked<ITransactionRepository>;
  let transferRepo: jest.Mocked<ITransferRepository>;
  let budgetRepo: jest.Mocked<IBudgetRepository>;
  let categoryRepo: jest.Mocked<ICategoryRepository>;
  let currencyRepo: jest.Mocked<ICurrencyRepository>;
  let recurringRuleRepo: jest.Mocked<IRecurringRuleRepository>;
  let service: ReportService;

  const defaultQuery = { from, to, includeRecurring: true };

  const accountWithCurrency = {
    id: accountId,
    userId,
    currencyId,
    name: "Main",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    isDeleted: false,
    currency: {
      id: currencyId,
      code: "UAH",
      name: "Hryvnia",
      minorUnits: 2,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      isDeleted: false,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();

    accountRepo = {
      findByIdWithCurrency: jest.fn(),
      findByFilter: jest.fn(),
    } as unknown as jest.Mocked<IAccountRepository>;

    transactionRepo = {
      sumAmount: jest.fn(),
      sumByCategory: jest.fn(),
      sumByAccount: jest.fn(),
      sumExpenseAmount: jest.fn(),
      sumByRecurringRule: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<ITransactionRepository>;

    transferRepo = {
      aggregateByAccount: jest.fn(),
      countAndSum: jest.fn(),
    } as unknown as jest.Mocked<ITransferRepository>;

    budgetRepo = {
      findIntersectingPeriod: jest.fn(),
    } as unknown as jest.Mocked<IBudgetRepository>;

    categoryRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ICategoryRepository>;

    currencyRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<ICurrencyRepository>;

    recurringRuleRepo = {
      findIntersectingPeriod: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<IRecurringRuleRepository>;

    service = new ReportService(
      accountRepo,
      transactionRepo,
      transferRepo,
      budgetRepo,
      categoryRepo,
      currencyRepo,
      recurringRuleRepo,
    );
  });

  it("повертає звіт по рахунку з підсумками", async () => {
    accountRepo.findByIdWithCurrency.mockResolvedValue(accountWithCurrency);
    transactionRepo.sumAmount.mockImplementation((_f, direction) =>
      Promise.resolve(direction === "INCOME" ? 1000 : 400),
    );
    transactionRepo.sumByCategory.mockResolvedValue([]);
    transactionRepo.sumByAccount.mockResolvedValue([
      { accountId, direction: "INCOME", amount: 1000 },
      { accountId, direction: "EXPENSE", amount: 400 },
    ]);
    transferRepo.aggregateByAccount.mockResolvedValue([]);
    transferRepo.countAndSum.mockResolvedValue({ count: 0, totalAmount: 0 });
    budgetRepo.findIntersectingPeriod.mockResolvedValue([]);
    currencyRepo.findById.mockResolvedValue(accountWithCurrency.currency);

    const report = await service.getFinancialReport(userId, { ...defaultQuery, accountId });

    expect(report.currencies).toHaveLength(1);
    expect(report.currencies[0]?.summary).toEqual({
      totalIncome: 1000,
      totalExpense: 400,
      net: 600,
    });
    expect(report.filters.accountId).toBe(accountId);
  });

  it("кидає NotFoundError для чужого рахунку", async () => {
    accountRepo.findByIdWithCurrency.mockResolvedValue(null);

    await expect(
      service.getFinancialReport(userId, { ...defaultQuery, accountId }),
    ).rejects.toThrow(NotFoundError);
  });

  it("групує загальний звіт по валютах при наявності руху", async () => {
    accountRepo.findByFilter.mockResolvedValue({
      data: [accountWithCurrency],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
    accountRepo.findByIdWithCurrency.mockResolvedValue(accountWithCurrency);
    transactionRepo.sumAmount.mockResolvedValue(500);
    transactionRepo.sumByCategory.mockResolvedValue([]);
    transactionRepo.sumByAccount.mockResolvedValue([]);
    transferRepo.aggregateByAccount.mockResolvedValue([]);
    transferRepo.countAndSum.mockResolvedValue({ count: 1, totalAmount: 200 });
    budgetRepo.findIntersectingPeriod.mockResolvedValue([]);
    currencyRepo.findById.mockResolvedValue(accountWithCurrency.currency);

    const report = await service.getFinancialReport(userId, defaultQuery);

    expect(report.currencies).toHaveLength(1);
    expect(report.currencies[0]?.currencyCode).toBe("UAH");
    expect(report.currencies[0]?.transfers.count).toBe(1);
  });

  it("додає секцію recurring з правилами та materialized", async () => {
    const ruleId = "clr7v9x1k0000qzq8x8x8x8xd";
    accountRepo.findByFilter.mockResolvedValue({
      data: [accountWithCurrency],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
    accountRepo.findByIdWithCurrency.mockResolvedValue(accountWithCurrency);
    transactionRepo.sumAmount.mockResolvedValue(0);
    transactionRepo.sumByCategory.mockResolvedValue([]);
    transactionRepo.sumByAccount.mockResolvedValue([]);
    transferRepo.aggregateByAccount.mockResolvedValue([]);
    transferRepo.countAndSum.mockResolvedValue({ count: 0, totalAmount: 0 });
    budgetRepo.findIntersectingPeriod.mockResolvedValue([]);
    currencyRepo.findById.mockResolvedValue(accountWithCurrency.currency);

    const recurringRule = {
      id: ruleId,
      userId,
      accountId,
      currencyId,
      categoryId: null,
      name: "Rent",
      direction: "EXPENSE",
      amount: 500,
      frequencyId: "clf7v9x1k0000qzq8x8x8x8xe",
      nextRunAt: new Date("2026-05-01T00:00:00.000Z"),
      endsAt: null,
      maxOccurrences: null,
      occurrenceCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      isDeleted: false,
      frequency: {
        id: "clf7v9x1k0000qzq8x8x8x8xe",
        userId,
        name: "Monthly",
        every: 1,
        unit: "MONTH",
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        isDeleted: false,
      },
    } as unknown as RecurringRuleWithFrequency;

    recurringRuleRepo.findIntersectingPeriod.mockResolvedValue([recurringRule]);
    transactionRepo.sumByRecurringRule.mockResolvedValue([
      {
        recurringRuleId: ruleId,
        amount: 500,
        transactionCount: 1,
      },
    ]);

    const report = await service.getFinancialReport(userId, defaultQuery);

    expect(report.recurring).toBeDefined();
    expect(report.recurring?.activeRulesCount).toBe(1);
    expect(report.recurring?.materializedAmount).toBe(500);
    expect(report.recurring?.byRule[0]?.ruleId).toBe(ruleId);
    expect(report.recurring?.byRule[0]?.materializedCount).toBe(1);
  });

  it("не додає recurring при includeRecurring=false", async () => {
    accountRepo.findByFilter.mockResolvedValue({
      data: [accountWithCurrency],
      total: 1,
      page: 1,
      limit: 100,
      totalPages: 1,
    });
    accountRepo.findByIdWithCurrency.mockResolvedValue(accountWithCurrency);
    transactionRepo.sumAmount.mockResolvedValue(0);
    transactionRepo.sumByCategory.mockResolvedValue([]);
    transactionRepo.sumByAccount.mockResolvedValue([]);
    transferRepo.aggregateByAccount.mockResolvedValue([]);
    transferRepo.countAndSum.mockResolvedValue({ count: 0, totalAmount: 0 });
    budgetRepo.findIntersectingPeriod.mockResolvedValue([]);
    currencyRepo.findById.mockResolvedValue(accountWithCurrency.currency);

    const report = await service.getFinancialReport(userId, {
      ...defaultQuery,
      includeRecurring: false,
    });

    expect(report.recurring).toBeUndefined();
    expect(recurringRuleRepo.findIntersectingPeriod).not.toHaveBeenCalled();
  });
});
