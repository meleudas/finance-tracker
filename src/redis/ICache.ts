export interface ICache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  has(key: string): Promise<boolean>;
  /**
   * Remaining TTL in seconds.
   * -2 = key does not exist, -1 = key exists without expiry.
   */
  ttl(key: string): Promise<number>;
  expire(key: string, ttlSeconds: number): Promise<void>;
  /** @param at Unix timestamp (seconds) or Date */
  expireAt(key: string, at: Date | number): Promise<void>;
  /** Prefer a narrow pattern; KEYS is O(N) and blocks Redis on large datasets. */
  keys(pattern: string): Promise<string[]>;
  /** Clears the current Redis database. Unsafe on shared instances. */
  clear(): Promise<void>;

  getJson<T>(key: string): Promise<T | null>;
  setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void>;
}
