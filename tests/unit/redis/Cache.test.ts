const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  flushdb: jest.fn(),
  keys: jest.fn(),
  ttl: jest.fn(),
  expire: jest.fn(),
  expireat: jest.fn(),
};

jest.mock("../../../src/config/redisClient", () => ({
  redis: mockRedis,
}));

import { Cache } from "../../../src/redis/Cache";

describe("Cache", () => {
  const cache = new Cache();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("get/set without ttl", async () => {
    mockRedis.get.mockResolvedValue("v");
    await cache.set("k", "v");
    expect(mockRedis.set).toHaveBeenCalledWith("k", "v");
    await expect(cache.get("k")).resolves.toBe("v");
  });

  it("set with ttl uses EX", async () => {
    await cache.set("k", "v", 60);
    expect(mockRedis.set).toHaveBeenCalledWith("k", "v", "EX", 60);
  });

  it("delete, has, clear, keys, ttl", async () => {
    mockRedis.exists.mockResolvedValue(1);
    mockRedis.keys.mockResolvedValue(["a"]);
    mockRedis.ttl.mockResolvedValue(30);

    await cache.delete("k");
    await expect(cache.has("k")).resolves.toBe(true);
    await cache.clear();
    await expect(cache.keys("p:*")).resolves.toEqual(["a"]);
    await expect(cache.ttl("k")).resolves.toBe(30);
  });

  it("expire and expireAt with Date", async () => {
    const at = new Date("2030-01-01T00:00:00.000Z");
    await cache.expire("k", 10);
    await cache.expireAt("k", at);
    expect(mockRedis.expire).toHaveBeenCalledWith("k", 10);
    expect(mockRedis.expireat).toHaveBeenCalledWith("k", Math.floor(at.getTime() / 1000));
  });

  it("expireAt with unix number", async () => {
    await cache.expireAt("k", 12345);
    expect(mockRedis.expireat).toHaveBeenCalledWith("k", 12345);
  });

  it("getJson parses JSON", async () => {
    mockRedis.get.mockResolvedValue(JSON.stringify({ a: 1 }));
    await expect(cache.getJson<{ a: number }>("k")).resolves.toEqual({ a: 1 });
  });

  it("getJson returns null for missing key", async () => {
    mockRedis.get.mockResolvedValue(null);
    await expect(cache.getJson("k")).resolves.toBeNull();
  });

  it("getJson returns null on invalid JSON", async () => {
    mockRedis.get.mockResolvedValue("{");
    await expect(cache.getJson("k")).resolves.toBeNull();
  });

  it("setJson stringifies value", async () => {
    await cache.setJson("k", { x: 1 }, 5);
    expect(mockRedis.set).toHaveBeenCalledWith("k", JSON.stringify({ x: 1 }), "EX", 5);
  });
});
