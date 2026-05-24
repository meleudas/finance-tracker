describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;

  afterEach(() => {
    process.env.NODE_ENV = originalEnv;
    jest.resetModules();
  });

  it("створює logger без transport у test", async () => {
    process.env.NODE_ENV = "test";
    jest.resetModules();
    const { logger } = await import("../../../src/config/logger");
    expect(logger.level).toBe(process.env.LOG_LEVEL ?? "silent");
  });

  it("додає pino-pretty transport у development, якщо модуль доступний", async () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    const { logger } = await import("../../../src/config/logger");
    expect(logger).toBeDefined();
  });

  it("працює без pino-pretty, якщо require.resolve падає", async () => {
    process.env.NODE_ENV = "development";
    jest.resetModules();
    jest.doMock("pino-pretty", () => {
      throw new Error("not installed");
    });
    const resolveSpy = jest.spyOn(require, "resolve").mockImplementation(() => {
      throw new Error("missing");
    });
    const { logger } = await import("../../../src/config/logger");
    expect(logger).toBeDefined();
    resolveSpy.mockRestore();
  });

  it("createModuleLogger додає поле module", async () => {
    process.env.NODE_ENV = "test";
    jest.resetModules();
    const { createModuleLogger } =
      (await import("../../../src/config/logger")) as typeof import("../../../src/config/logger");
    const moduleLogger = createModuleLogger("TestModule");
    expect(moduleLogger.bindings()).toEqual(expect.objectContaining({ module: "TestModule" }));
  });
});
