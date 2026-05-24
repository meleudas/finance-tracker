const listenCb = jest.fn();

jest.mock("../../src/config/prismaClient", () => ({}));
jest.mock("../../src/config/redisClient", () => ({
  connectRedis: jest.fn().mockResolvedValue(undefined),
}));
jest.mock("../../src/app", () => ({
  createApp: jest.fn().mockReturnValue({
    listen: jest.fn((_port: number, cb: () => void) => {
      listenCb();
      cb();
    }),
  }),
}));
jest.mock("../../src/config/logger", () => ({
  logger: { info: jest.fn() },
}));
jest.mock("../../src/container", () => ({
  getRecurringRuleRunnerService: jest.fn().mockReturnValue({}),
}));
jest.mock("../../src/scheduler/recurringScheduler", () => ({
  startRecurringScheduler: jest.fn(),
}));

import { connectRedis } from "../../src/config/redisClient";
import { createApp } from "../../src/app";
import { logger } from "../../src/config/logger";
import { startRecurringScheduler } from "../../src/scheduler/recurringScheduler";

describe("src/index.ts", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("bootstraps server on main()", async () => {
    await import("../../src/index");

    expect(connectRedis).toHaveBeenCalled();
    expect(createApp).toHaveBeenCalled();
    expect(listenCb).toHaveBeenCalled();
    expect(logger.info).toHaveBeenCalledWith(
      expect.objectContaining({ port: expect.any(Number) }),
      expect.any(String),
    );
    expect(startRecurringScheduler).toHaveBeenCalled();
  });
});
