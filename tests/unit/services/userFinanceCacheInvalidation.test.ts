import { invalidateUserTransactionAndBudgetCache } from "../../../src/services/impl/userFinanceCacheInvalidation";
import type { ICache } from "../../../src/redis";

describe("invalidateUserTransactionAndBudgetCache", () => {
  const userId = "clg7v9x1k0000qzq8x8x8x8x8";

  it("deletes keys for all finance cache prefixes", async () => {
    const cache = {
      keys: jest
        .fn()
        .mockResolvedValueOnce(["transaction-list:u:1"])
        .mockResolvedValueOnce(["transaction:u:1"])
        .mockResolvedValueOnce(["budget:list:u:1"])
        .mockResolvedValueOnce(["budget:item:u:1"])
        .mockResolvedValueOnce(["budget:progress:u:1"]),
      delete: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<ICache>;

    await invalidateUserTransactionAndBudgetCache(cache, userId);

    expect(cache.keys).toHaveBeenCalledTimes(5);
    expect(cache.delete).toHaveBeenCalledTimes(5);
  });
});
