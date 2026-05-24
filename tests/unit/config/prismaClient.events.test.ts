const mockOn = jest.fn();
const mockClient = { $on: mockOn };

jest.mock("@prisma/adapter-pg", () => ({
  PrismaPg: jest.fn(),
}));

jest.mock("../../../src/generated/prisma/client", () => ({
  PrismaClient: jest.fn(() => mockClient),
}));

jest.mock("../../../src/config/env", () => ({
  env: { NODE_ENV: "development", DATABASE_URL: "postgresql://localhost/db" },
}));

jest.mock("../../../src/config/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));

jest.mock("../../../src/config/prismaSoftDeleteExtension", () => ({
  withSoftDeleteExtension: (client: unknown) => client,
}));

describe("prismaClient event listeners", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (globalThis as { prisma?: unknown }).prisma = undefined;
    jest.resetModules();
  });

  it("реєструє query listener у non-production", async () => {
    const { logger } = await import("../../../src/config/logger");
    await import("../../../src/config/prismaClient");

    const queryHandler = mockOn.mock.calls.find(([event]) => event === "query")?.[1] as
      | ((e: { query: string; params: string; duration: number }) => void)
      | undefined;
    queryHandler?.({ query: "SELECT 1", params: "[]", duration: 1 });
    expect(logger.debug).toHaveBeenCalled();
  });

  it("реєструє error, warn, info listeners", async () => {
    const { logger } = await import("../../../src/config/logger");
    await import("../../../src/config/prismaClient");

    const errorHandler = mockOn.mock.calls.find(([event]) => event === "error")?.[1] as
      | ((e: { message: string; target: string }) => void)
      | undefined;
    const warnHandler = mockOn.mock.calls.find(([event]) => event === "warn")?.[1] as
      | ((e: { message: string; target: string }) => void)
      | undefined;
    const infoHandler = mockOn.mock.calls.find(([event]) => event === "info")?.[1] as
      | ((e: { message: string; target: string }) => void)
      | undefined;

    errorHandler?.({ message: "err", target: "db" });
    warnHandler?.({ message: "warn", target: "db" });
    infoHandler?.({ message: "info", target: "db" });

    expect(logger.error).toHaveBeenCalled();
    expect(logger.warn).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalled();
  });
});
