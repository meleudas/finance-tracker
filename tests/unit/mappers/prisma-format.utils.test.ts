import { decimalToNumber, toIsoString } from "../../../src/mappers/prisma-format.utils";

describe("prisma-format.utils", () => {
  it("toIsoString приймає string без змін", () => {
    expect(toIsoString("2026-05-01T00:00:00.000Z")).toBe("2026-05-01T00:00:00.000Z");
  });

  it("decimalToNumber для prisma decimal object", () => {
    expect(decimalToNumber({ toNumber: () => 12.5 })).toBe(12.5);
  });
});
