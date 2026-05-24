const mockConnect = jest.fn().mockResolvedValue(undefined);
const mockQuit = jest.fn().mockResolvedValue(undefined);

const MockRedis = jest.fn().mockImplementation(() => ({
  status: "wait",
  on: jest.fn(),
  connect: mockConnect,
  quit: mockQuit,
}));

jest.mock("ioredis", () => ({
  __esModule: true,
  default: MockRedis,
}));

jest.mock("../../../src/config/logger", () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

describe("redisClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    (globalThis as unknown as { redis?: unknown }).redis = undefined;
    mockConnect.mockResolvedValue(undefined);
    mockQuit.mockResolvedValue(undefined);
  });

  it("створює клієнт з lazyConnect у test", async () => {
    const { redis } = await import("../../../src/config/redisClient");
    expect(MockRedis).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ lazyConnect: true, maxRetriesPerRequest: 0 }),
    );
    expect(redis).toBeDefined();
  });

  it("реєструє connect та error listeners", async () => {
    const { logger } = await import("../../../src/config/logger");
    await import("../../../src/config/redisClient");
    const instance = MockRedis.mock.results.at(-1)?.value as { on: jest.Mock };
    const connectHandler = instance.on.mock.calls.find(([event]) => event === "connect")?.[1] as
      | (() => void)
      | undefined;
    const errorHandler = instance.on.mock.calls.find(([event]) => event === "error")?.[1] as
      | ((error: Error) => void)
      | undefined;
    connectHandler?.();
    errorHandler?.(new Error("redis down"));
    expect(logger.info).toHaveBeenCalledWith("Redis connected");
    expect(logger.error).toHaveBeenCalled();
  });

  it("connectRedis підключає, якщо не ready/connecting", async () => {
    const mod =
      (await import("../../../src/config/redisClient")) as typeof import("../../../src/config/redisClient");
    Object.defineProperty(mod.redis, "status", { value: "wait", configurable: true });
    await mod.connectRedis();
    expect(mockConnect).toHaveBeenCalled();
  });

  it("connectRedis пропускає, якщо ready", async () => {
    const mod =
      (await import("../../../src/config/redisClient")) as typeof import("../../../src/config/redisClient");
    Object.defineProperty(mod.redis, "status", { value: "ready", configurable: true });
    await mod.connectRedis();
    expect(mockConnect).not.toHaveBeenCalled();
  });

  it("disconnectRedis викликає quit", async () => {
    const mod =
      (await import("../../../src/config/redisClient")) as typeof import("../../../src/config/redisClient");
    Object.defineProperty(mod.redis, "status", { value: "ready", configurable: true });
    await mod.disconnectRedis();
    expect(mockQuit).toHaveBeenCalled();
  });

  it("disconnectRedis пропускає quit для end/wait", async () => {
    const mod =
      (await import("../../../src/config/redisClient")) as typeof import("../../../src/config/redisClient");
    Object.defineProperty(mod.redis, "status", { value: "end", configurable: true });
    await mod.disconnectRedis();
    expect(mockQuit).not.toHaveBeenCalled();
  });
});
