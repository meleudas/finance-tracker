import type { AccountWithCurrency } from "../../repositories/interfaces/IAccountRepository";
import type { IAccountRepository } from "../../repositories/interfaces/IAccountRepository";
import type { IBudgetRepository } from "../../repositories/interfaces/IBudgetRepository";
import type { ICategoryRepository } from "../../repositories/interfaces/ICategoryRepository";
import type { ICurrencyRepository } from "../../repositories/interfaces/ICurrencyRepository";
import type { ITransactionRepository } from "../../repositories/interfaces/ITransactionRepository";
import type { ITransferRepository } from "../../repositories/interfaces/ITransferRepository";
import type { IRecurringRuleRepository } from "../../repositories/interfaces/IRecurringRuleRepository";
import type { FinancialReportDto } from "../../dtos/report/FinancialReport.dto";
import type { ReportQueryDto } from "../../dtos/report/ReportQuery.dto";
import type { BudgetProgressDto } from "../../dtos/budget/BudgetProgress.dto";
import { NotFoundError } from "../../utils/errors/ClientErrors";
import { decimalToNumber } from "../../utils/helpers/decimalHelpers";
import type { IReportService } from "../interfaces/IReportService";
import type { ServiceContext } from "../serviceContext";
import { repoOptions } from "../serviceContext";
import { countRunsInPeriod, formatFrequencyLabel } from "../../utils/helpers/recurringSchedule";

const UNCATEGORIZED_LABEL = "Uncategorized";

export class ReportService implements IReportService {
  constructor(
    private readonly accountRepo: IAccountRepository,
    private readonly transactionRepo: ITransactionRepository,
    private readonly transferRepo: ITransferRepository,
    private readonly budgetRepo: IBudgetRepository,
    private readonly categoryRepo: ICategoryRepository,
    private readonly currencyRepo: ICurrencyRepository,
    private readonly recurringRuleRepo: IRecurringRuleRepository,
  ) {}

  async getFinancialReport(
    userId: string,
    query: ReportQueryDto,
    ctx?: ServiceContext,
  ): Promise<FinancialReportDto> {
    return this.buildFinancialReport(userId, query, ctx);
  }

  async buildFinancialReport(
    userId: string,
    query: ReportQueryDto,
    ctx?: ServiceContext,
  ): Promise<FinancialReportDto> {
    const options = repoOptions(ctx);
    const accounts = await this.resolveAccounts(userId, query.accountId, options);

    const currencyIds = [...new Set(accounts.map((a) => a.currencyId))];
    const currencyBlocks: FinancialReportDto["currencies"] = [];

    for (const currencyId of currencyIds) {
      const currencyAccounts = accounts.filter((a) => a.currencyId === currencyId);
      const accountIds = new Set(currencyAccounts.map((a) => a.id));

      const txFilter = {
        userId,
        currencyId,
        from: query.from,
        to: query.to,
        ...(query.accountId && { accountId: query.accountId }),
      };

      const [
        totalIncome,
        totalExpense,
        categoryRows,
        accountRows,
        transferByAccount,
        transferSummary,
      ] = await Promise.all([
        this.transactionRepo.sumAmount(txFilter, "INCOME", options),
        this.transactionRepo.sumAmount(txFilter, "EXPENSE", options),
        this.transactionRepo.sumByCategory(txFilter, options),
        this.transactionRepo.sumByAccount(txFilter, options),
        this.transferRepo.aggregateByAccount(
          {
            userId,
            currencyId,
            from: query.from,
            to: query.to,
            ...(query.accountId && { accountId: query.accountId }),
          },
          options,
        ),
        this.transferRepo.countAndSum(
          {
            userId,
            currencyId,
            from: query.from,
            to: query.to,
            ...(query.accountId && { accountId: query.accountId }),
          },
          options,
        ),
      ]);

      const hasActivity =
        query.accountId != null || totalIncome > 0 || totalExpense > 0 || transferSummary.count > 0;

      if (!hasActivity) {
        continue;
      }

      const currency = await this.currencyRepo.findById(currencyId, options);
      const currencyCode = currency?.code ?? "???";

      const byCategory = await this.buildCategoryBreakdown(categoryRows, options);
      const byAccount = this.buildAccountBreakdown(
        currencyAccounts,
        accountRows,
        transferByAccount,
        accountIds,
      );
      const budgets = await this.buildBudgetProgress(
        userId,
        query.from,
        query.to,
        query.accountId,
        currencyId,
        options,
      );

      currencyBlocks.push({
        currencyId,
        currencyCode,
        summary: {
          totalIncome,
          totalExpense,
          net: totalIncome - totalExpense,
        },
        byCategory,
        byAccount,
        transfers: transferSummary,
        budgets,
      });
    }

    if (query.accountId && currencyBlocks.length === 0) {
      const account = accounts[0];
      if (!account) {
        throw new NotFoundError("Account");
      }
      const currency = account.currency;
      currencyBlocks.push({
        currencyId: account.currencyId,
        currencyCode: currency.code,
        summary: { totalIncome: 0, totalExpense: 0, net: 0 },
        byCategory: [],
        byAccount: [
          {
            accountId: account.id,
            accountName: account.name,
            income: 0,
            expense: 0,
            transfersIn: 0,
            transfersOut: 0,
            netTransfer: 0,
            periodNet: 0,
          },
        ],
        transfers: { count: 0, totalAmount: 0 },
        budgets: await this.buildBudgetProgress(
          userId,
          query.from,
          query.to,
          query.accountId,
          account.currencyId,
          options,
        ),
      });
    }

    const includeRecurring = query.includeRecurring;
    const recurring = includeRecurring
      ? await this.buildRecurringSection(userId, query, options)
      : undefined;

    return {
      period: {
        from: query.from.toISOString(),
        to: query.to.toISOString(),
      },
      filters: {
        ...(query.accountId && { accountId: query.accountId }),
        includeRecurring,
      },
      currencies: currencyBlocks,
      ...(recurring && { recurring }),
    };
  }

  private async buildRecurringSection(
    userId: string,
    query: ReportQueryDto,
    options: ReturnType<typeof repoOptions>,
  ): Promise<FinancialReportDto["recurring"]> {
    const rules = await this.recurringRuleRepo.findIntersectingPeriod(
      userId,
      query.from,
      query.to,
      query.accountId,
      options,
    );

    const materializedRows = await this.transactionRepo.sumByRecurringRule(
      {
        userId,
        from: query.from,
        to: query.to,
        ...(query.accountId && { accountId: query.accountId }),
      },
      options,
    );

    const materializedByRule = new Map(materializedRows.map((r) => [r.recurringRuleId, r]));

    const byRule: NonNullable<FinancialReportDto["recurring"]>["byRule"] = [];
    let projectedAmount = 0;
    let materializedAmount = 0;

    for (const rule of rules) {
      const materialized = materializedByRule.get(rule.id);
      const materializedCount = materialized?.transactionCount ?? 0;
      const materializedTotal = materialized?.amount ?? 0;
      const runsInPeriod = countRunsInPeriod({
        nextRunAt: rule.nextRunAt,
        every: rule.frequency.every,
        unit: rule.frequency.unit,
        periodStart: query.from,
        periodEnd: query.to,
        endsAt: rule.endsAt,
        maxOccurrences: rule.maxOccurrences,
        occurrenceCount: rule.occurrenceCount,
      });

      projectedAmount += runsInPeriod * decimalToNumber(rule.amount);
      materializedAmount += materializedTotal;

      byRule.push({
        ruleId: rule.id,
        name: rule.name,
        direction: rule.direction,
        amount: decimalToNumber(rule.amount),
        frequencyLabel: formatFrequencyLabel(rule.frequency.every, rule.frequency.unit),
        runsInPeriod,
        materializedCount,
        materializedTotal,
      });
    }

    return {
      activeRulesCount: rules.length,
      materializedAmount,
      projectedAmount,
      byRule,
    };
  }

  private async resolveAccounts(
    userId: string,
    accountId: string | undefined,
    options: ReturnType<typeof repoOptions>,
  ): Promise<AccountWithCurrency[]> {
    if (accountId) {
      const account = await this.accountRepo.findByIdWithCurrency(accountId, userId, options);
      if (!account) {
        throw new NotFoundError("Account");
      }
      return [account];
    }

    const result = await this.accountRepo.findByFilter(
      { userId, isDeleted: false },
      { page: 1, limit: 100 },
      options,
    );

    const accounts: AccountWithCurrency[] = [];
    for (const account of result.data) {
      const withCurrency = await this.accountRepo.findByIdWithCurrency(account.id, userId, options);
      if (withCurrency) {
        accounts.push(withCurrency);
      }
    }
    return accounts;
  }

  private async buildCategoryBreakdown(
    rows: Awaited<ReturnType<ITransactionRepository["sumByCategory"]>>,
    options: ReturnType<typeof repoOptions>,
  ): Promise<FinancialReportDto["currencies"][number]["byCategory"]> {
    const breakdown: FinancialReportDto["currencies"][number]["byCategory"] = [];

    for (const row of rows) {
      let categoryName = UNCATEGORIZED_LABEL;
      if (row.categoryId) {
        const category = await this.categoryRepo.findById(row.categoryId, options);
        if (category && !category.isDeleted) {
          categoryName = category.name;
        }
      }

      breakdown.push({
        categoryId: row.categoryId,
        categoryName,
        kind: row.direction,
        amount: row.amount,
        transactionCount: row.transactionCount,
      });
    }

    return breakdown;
  }

  private buildAccountBreakdown(
    accounts: AccountWithCurrency[],
    accountRows: Awaited<ReturnType<ITransactionRepository["sumByAccount"]>>,
    transferRows: Awaited<ReturnType<ITransferRepository["aggregateByAccount"]>>,
    scopedAccountIds: Set<string>,
  ): FinancialReportDto["currencies"][number]["byAccount"] {
    const incomeByAccount = new Map<string, number>();
    const expenseByAccount = new Map<string, number>();

    for (const row of accountRows) {
      if (row.direction === "INCOME") {
        incomeByAccount.set(row.accountId, row.amount);
      } else {
        expenseByAccount.set(row.accountId, row.amount);
      }
    }

    const transferByAccount = new Map(
      transferRows.filter((t) => scopedAccountIds.has(t.accountId)).map((t) => [t.accountId, t]),
    );

    return accounts.map((account) => {
      const income = incomeByAccount.get(account.id) ?? 0;
      const expense = expenseByAccount.get(account.id) ?? 0;
      const transfers = transferByAccount.get(account.id);
      const transfersIn = transfers?.transfersIn ?? 0;
      const transfersOut = transfers?.transfersOut ?? 0;

      return {
        accountId: account.id,
        accountName: account.name,
        income,
        expense,
        transfersIn,
        transfersOut,
        netTransfer: transfersIn - transfersOut,
        periodNet: income - expense,
      };
    });
  }

  private async buildBudgetProgress(
    userId: string,
    from: Date,
    to: Date,
    accountId: string | undefined,
    currencyId: string,
    options: ReturnType<typeof repoOptions>,
  ): Promise<BudgetProgressDto[]> {
    const budgets = await this.budgetRepo.findIntersectingPeriod(
      userId,
      from,
      to,
      accountId,
      options,
    );

    const relevant = budgets.filter((b) => b.currencyId === currencyId);

    return Promise.all(
      relevant.map(async (budget) => {
        const spentAmount = await this.transactionRepo.sumExpenseAmount(
          {
            userId,
            accountId: budget.accountId,
            categoryId: budget.categoryId ?? undefined,
            from: budget.periodStart,
            to: budget.periodEnd,
          },
          options,
        );

        const limitAmount = decimalToNumber(budget.limitAmount);
        const remainingAmount = Math.max(0, limitAmount - spentAmount);
        const currency = await this.currencyRepo.findById(budget.currencyId, options);

        return {
          id: budget.id,
          name: budget.name,
          limitAmount,
          spentAmount,
          remainingAmount,
          isExceeded: spentAmount > limitAmount,
          periodStart: budget.periodStart.toISOString(),
          periodEnd: budget.periodEnd.toISOString(),
          accountId: budget.accountId,
          categoryId: budget.categoryId,
          currencyCode: currency?.code ?? "UAH",
        };
      }),
    );
  }
}
