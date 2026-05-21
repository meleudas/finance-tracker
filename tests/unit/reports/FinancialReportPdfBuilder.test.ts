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
});
