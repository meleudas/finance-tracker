import { isPrismaUniqueViolation } from "../../../src/utils/helpers/prismaErrors";

describe("isPrismaUniqueViolation", () => {
  it("повертає true для P2002", () => {
    expect(isPrismaUniqueViolation({ code: "P2002" })).toBe(true);
  });

  it("повертає false для інших кодів", () => {
    expect(isPrismaUniqueViolation({ code: "P2025" })).toBe(false);
  });

  it("повертає false для не-об’єктів", () => {
    expect(isPrismaUniqueViolation(null)).toBe(false);
    expect(isPrismaUniqueViolation("error")).toBe(false);
  });
});
