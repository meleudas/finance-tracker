import {
  amountSchema,
  dateRangeRefineConfig,
  hasValidDateRange,
  isNonEmptyPatch,
  nonNegativeAmountSchema,
  optionalNoteSchema,
} from "../../../src/dtos/common/schemas";

describe("common schemas", () => {
  it("amountSchema відхиляє зайві десяткові", () => {
    expect(amountSchema.safeParse(1.23456).success).toBe(false);
  });

  it("nonNegativeAmountSchema приймає 0", () => {
    expect(nonNegativeAmountSchema.safeParse(0).success).toBe(true);
  });

  it("optionalNoteSchema приймає порожній рядок та null", () => {
    expect(optionalNoteSchema.safeParse("").success).toBe(true);
    expect(optionalNoteSchema.safeParse(null).success).toBe(true);
  });

  it("hasValidDateRange та isNonEmptyPatch", () => {
    expect(hasValidDateRange({ from: new Date("2026-06-01"), to: new Date("2026-01-01") })).toBe(
      false,
    );
    expect(isNonEmptyPatch({})).toBe(false);
    expect(dateRangeRefineConfig.path).toEqual(["to"]);
  });
});
