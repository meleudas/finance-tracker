import { Prisma } from "../../../src/generated/prisma/client";
import { toBudgetResponseWithCalculations } from "../../../src/mappers/budget.mapper";

const baseBudget = {
  id: "clseed0000000000000000148",
  userId: "clseed0000000000000000000",
  name: "Trial budget",
  accountId: "clseed0000000000000000022",
  currencyId: "clseed0000000000000000002",
  categoryId: "clseed0000000000000000046",
  limitAmount: new Prisma.Decimal(500),
  periodStart: new Date("2026-02-01T00:00:00.000Z"),
  periodEnd: new Date("2026-03-31T23:59:59.999Z"),
  createdAt: new Date("2026-02-01T00:00:00.000Z"),
  updatedAt: new Date("2026-02-01T00:00:00.000Z"),
  deletedAt: null,
  isDeleted: false,
};

describe("toBudgetResponseWithCalculations", () => {
  it("accepts zero spent and full remaining", () => {
    const result = toBudgetResponseWithCalculations(baseBudget, 0, 500);

    expect(result.spentAmount).toBe(0);
    expect(result.remainingAmount).toBe(500);
    expect(result.limitAmount).toBe(500);
  });

  it("accepts zero remaining when budget is fully spent", () => {
    const result = toBudgetResponseWithCalculations(baseBudget, 500, 0);

    expect(result.spentAmount).toBe(500);
    expect(result.remainingAmount).toBe(0);
  });
});
