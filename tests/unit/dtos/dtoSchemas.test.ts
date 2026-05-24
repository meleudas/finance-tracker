import { UpdateTransferSchema } from "../../../src/dtos/transfer/UpdateTransfer.dto";
import { BudgetQuerySchema } from "../../../src/dtos/budget/BudgetQuery.dto";
import { nonNegativeAmountSchema } from "../../../src/dtos/common/schemas";

describe("DTO schemas — branch coverage", () => {
  it("UpdateTransferSchema: порожній patch відхиляється", () => {
    expect(UpdateTransferSchema.safeParse({}).success).toBe(false);
  });

  it("UpdateTransferSchema: однакові from/to accounts відхиляються", () => {
    const id = "clg7v9x1k0000qzq8x8x8x8x8";
    expect(
      UpdateTransferSchema.safeParse({
        fromAccountId: id,
        toAccountId: id,
      }).success,
    ).toBe(false);
  });

  it("UpdateTransferSchema: різні accounts приймаються", () => {
    expect(
      UpdateTransferSchema.safeParse({
        amount: 10,
        fromAccountId: "clg7v9x1k0000qzq8x8x8x8x8",
        toAccountId: "cln7v9x1k0000qzq8x8x8x8x1",
      }).success,
    ).toBe(true);
  });

  it("UpdateTransferSchema: лише fromAccountId без to — refine пропускає", () => {
    expect(
      UpdateTransferSchema.safeParse({
        fromAccountId: "clg7v9x1k0000qzq8x8x8x8x8",
      }).success,
    ).toBe(true);
  });

  it("BudgetQuerySchema: activeNow та period bounds", () => {
    expect(
      BudgetQuerySchema.safeParse({
        page: 1,
        limit: 20,
        activeNow: true,
        from: "2026-01-01T00:00:00.000Z",
        to: "2026-12-31T23:59:59.999Z",
      }).success,
    ).toBe(true);
  });

  it("nonNegativeAmountSchema приймає 0", () => {
    expect(nonNegativeAmountSchema.safeParse(0).success).toBe(true);
  });
});
