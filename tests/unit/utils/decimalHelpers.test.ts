import { decimalToNumber } from "../../../src/utils/helpers/decimalHelpers";

describe("decimalToNumber", () => {
  it("повертає 0 для null/undefined", () => {
    expect(decimalToNumber(null)).toBe(0);
    expect(decimalToNumber(undefined)).toBe(0);
  });

  it("повертає number без змін", () => {
    expect(decimalToNumber(42.5)).toBe(42.5);
  });

  it("парсить рядок", () => {
    expect(decimalToNumber("12.34")).toBe(12.34);
  });

  it("повертає 0 для невалідного рядка", () => {
    expect(decimalToNumber("not-a-number")).toBe(0);
  });

  it("викликає toNumber() для Decimal-подібних об’єктів", () => {
    expect(decimalToNumber({ toNumber: () => 99 })).toBe(99);
  });

  it("конвертує boolean через Number()", () => {
    expect(decimalToNumber(true)).toBe(1);
  });
});
