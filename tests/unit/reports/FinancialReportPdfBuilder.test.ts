import { buildFinancialReportPdf } from "../../../src/reports/pdf/FinancialReportPdfBuilder";
import type { FinancialReportDto } from "../../../src/dtos/report/FinancialReport.dto";

describe("FinancialReportPdfBuilder", () => {
  const sampleReport: FinancialReportDto = {
    period: {
      from: "2026-05-01T00:00:00.000Z",
      to: "2026-05-31T23:59:59.999Z",
    },
    filters: { includeRecurring: true },
    currencies: [
      {
        currencyId: "clm7v9x1k0000qzq8x8x8x8xc",
        currencyCode: "UAH",
        summary: { totalIncome: 100, totalExpense: 50, net: 50 },
        byCategory: [],
        byAccount: [],
        transfers: { count: 0, totalAmount: 0 },
        budgets: [],
      },
    ],
    recurring: {
      activeRulesCount: 1,
      materializedAmount: 50,
      projectedAmount: 100,
      byRule: [
        {
          ruleId: "clr7v9x1k0000qzq8x8x8x8xd",
          name: "Rent",
          direction: "EXPENSE",
          amount: 50,
          frequencyLabel: "Every 1 month",
          runsInPeriod: 2,
          materializedCount: 1,
          materializedTotal: 50,
        },
      ],
    },
  };

  it("генерує непорожній PDF buffer", async () => {
    const buffer = await buildFinancialReportPdf(sampleReport);

    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(100);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });

  it("включає account filter, категорії та рахунки", async () => {
    const baseCurrency = sampleReport.currencies[0];
    if (baseCurrency === undefined) {
      throw new Error("expected sample currency");
    }

    const detailed: FinancialReportDto = {
      ...sampleReport,
      filters: { includeRecurring: true, accountId: "clacc0000000000000000001" },
      currencies: [
        {
          ...baseCurrency,
          byCategory: [
            {
              categoryId: "clcat0000000000000000001",
              categoryName: "Food",
              kind: "EXPENSE",
              amount: 50,
              transactionCount: 2,
            },
          ],
          byAccount: [
            {
              accountId: "clacc0000000000000000001",
              accountName: "Main",
              income: 100,
              expense: 50,
              transfersIn: 0,
              transfersOut: 0,
              netTransfer: 0,
              periodNet: 50,
            },
          ],
        },
      ],
    };

    const buffer = await buildFinancialReportPdf(detailed);
    expect(buffer.length).toBeGreaterThan(200);
  });

  it("генерує PDF без recurring блоку", async () => {
    const { recurring: _r, ...withoutRecurring } = sampleReport;
    const buffer = await buildFinancialReportPdf(withoutRecurring as FinancialReportDto);
    expect(buffer.subarray(0, 4).toString()).toBe("%PDF");
  });
});
