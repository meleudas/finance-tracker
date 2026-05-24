jest.mock("../../src/storage/FileStorage");
jest.mock("../../src/redis/Cache");

describe("container", () => {
  it("lazy-ініціалізує recurring runner service", async () => {
    const { getRecurringRuleRunnerService } =
      (await import("../../src/container")) as typeof import("../../src/container");
    const a = getRecurringRuleRunnerService();
    const b = getRecurringRuleRunnerService();
    expect(a).toBe(b);
  });
});
