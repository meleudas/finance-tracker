import type { ICache } from "../../redis";
import type { ServiceContext } from "../serviceContext";
import { withServiceSignal } from "../serviceContext";

const TRANSACTION_LIST_CACHE_PREFIX = "transaction-list";
const TRANSACTION_ITEM_CACHE_PREFIX = "transaction";
const BUDGET_LIST_CACHE_PREFIX = "budget:list";
const BUDGET_ITEM_CACHE_PREFIX = "budget:item";
const BUDGET_PROGRESS_CACHE_PREFIX = "budget:progress";

export async function invalidateUserTransactionAndBudgetCache(
  cache: ICache,
  userId: string,
  ctx?: ServiceContext,
): Promise<void> {
  const prefixes = [
    `${TRANSACTION_LIST_CACHE_PREFIX}:${userId}:`,
    `${TRANSACTION_ITEM_CACHE_PREFIX}:${userId}:`,
    `${BUDGET_LIST_CACHE_PREFIX}:${userId}:`,
    `${BUDGET_ITEM_CACHE_PREFIX}:${userId}:`,
    `${BUDGET_PROGRESS_CACHE_PREFIX}:${userId}:`,
  ];

  for (const prefix of prefixes) {
    const keys = await withServiceSignal(cache.keys(`${prefix}*`), ctx);
    await Promise.all(keys.map((key) => withServiceSignal(cache.delete(key), ctx)));
  }
}
