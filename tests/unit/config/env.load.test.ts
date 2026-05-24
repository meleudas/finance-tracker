describe("env loadEnv", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
    jest.resetModules();
    jest.restoreAllMocks();
  });

  it("викликає process.exit(1) при невалідних змінних", async () => {
    process.env = { NODE_ENV: "invalid" };
    const exitSpy = jest.spyOn(process, "exit").mockImplementation((() => {
      throw new Error("exit");
    }) as never);
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => undefined);

    await expect(
      jest.isolateModulesAsync(async () => {
        await import("../../../src/config/env");
      }),
    ).rejects.toThrow("exit");

    expect(exitSpy).toHaveBeenCalledWith(1);
    expect(errorSpy).toHaveBeenCalled();
  });
});
