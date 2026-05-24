import { jwtTtlToMs } from "../../../src/utils/jwtTtl";

describe("jwtTtlToMs", () => {
  it("конвертує секунди, хвилини, години та дні", () => {
    expect(jwtTtlToMs("30s")).toBe(30_000);
    expect(jwtTtlToMs("15m")).toBe(15 * 60 * 1000);
    expect(jwtTtlToMs("2h")).toBe(2 * 60 * 60 * 1000);
    expect(jwtTtlToMs("7d")).toBe(7 * 24 * 60 * 60 * 1000);
  });

  it("ігнорує пробіли навколо значення", () => {
    expect(jwtTtlToMs(" 1h ")).toBe(60 * 60 * 1000);
  });

  it("кидає для невалідного формату", () => {
    expect(() => jwtTtlToMs("invalid")).toThrow(/Invalid JWT TTL format/);
    expect(() => jwtTtlToMs("10x")).toThrow(/Invalid JWT TTL format/);
  });

  it("кидає для невідомої одиниці після regex match", () => {
    const originalExec = RegExp.prototype.exec;
    RegExp.prototype.exec = function (this: RegExp, str: string) {
      if (str === "5z") return ["5z", "5", "z"] as unknown as RegExpExecArray;
      return originalExec.call(this, str);
    };
    try {
      expect(() => jwtTtlToMs("5z")).toThrow(/Invalid JWT TTL unit/);
    } finally {
      RegExp.prototype.exec = originalExec;
    }
  });
});
