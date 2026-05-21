import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { isoDatetimeSchema } from "../common/schemas";
import { BudgetProgressResponseSchema } from "../budget/BudgetProgress.dto";

const nonNegativeAmountSchema = z
  .number()
  .nonnegative()
  .refine((val) => Number(val.toFixed(4)) === val, {
    message: "At most 4 decimal places",
  });

export const reportSummarySchema = z
  .object({
    totalIncome: nonNegativeAmountSchema,
    totalExpense: nonNegativeAmountSchema,
    net: z.number(),
  })
  .strict();

export const reportCategoryBreakdownSchema = z
  .object({
    categoryId: cuidSchema.nullable(),
    categoryName: z.string(),
    kind: z.enum(["INCOME", "EXPENSE"]),
    amount: nonNegativeAmountSchema,
    transactionCount: z.number().int().nonnegative(),
  })
  .strict();

export const reportAccountBreakdownSchema = z
  .object({
    accountId: cuidSchema,
    accountName: z.string(),
    income: nonNegativeAmountSchema,
    expense: nonNegativeAmountSchema,
    transfersIn: nonNegativeAmountSchema,
    transfersOut: nonNegativeAmountSchema,
    netTransfer: z.number(),
    periodNet: z.number(),
  })
  .strict();

export const reportTransfersSummarySchema = z
  .object({
    count: z.number().int().nonnegative(),
    totalAmount: nonNegativeAmountSchema,
  })
  .strict();

export const reportCurrencyBlockSchema = z
  .object({
    currencyId: cuidSchema,
    currencyCode: z.string().length(3),
    summary: reportSummarySchema,
    byCategory: z.array(reportCategoryBreakdownSchema),
    byAccount: z.array(reportAccountBreakdownSchema),
    transfers: reportTransfersSummarySchema,
    budgets: z.array(BudgetProgressResponseSchema),
  })
  .strict();

export const reportRecurringRuleBreakdownSchema = z
  .object({
    ruleId: cuidSchema,
    name: z.string(),
    direction: z.enum(["INCOME", "EXPENSE"]),
    amount: nonNegativeAmountSchema,
    frequencyLabel: z.string(),
    runsInPeriod: z.number().int().nonnegative(),
    materializedCount: z.number().int().nonnegative(),
    materializedTotal: nonNegativeAmountSchema,
  })
  .strict();

export const reportRecurringSectionSchema = z
  .object({
    activeRulesCount: z.number().int().nonnegative(),
    materializedAmount: nonNegativeAmountSchema,
    projectedAmount: nonNegativeAmountSchema,
    byRule: z.array(reportRecurringRuleBreakdownSchema),
  })
  .strict();

export const financialReportSchema = z
  .object({
    period: z
      .object({
        from: isoDatetimeSchema,
        to: isoDatetimeSchema,
      })
      .strict(),
    filters: z
      .object({
        accountId: cuidSchema.optional(),
        includeRecurring: z.boolean().optional(),
      })
      .strict(),
    currencies: z.array(reportCurrencyBlockSchema),
    recurring: reportRecurringSectionSchema.optional(),
  })
  .strict();

export type FinancialReportDto = z.infer<typeof financialReportSchema>;
