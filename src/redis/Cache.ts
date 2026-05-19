import { redis } from "../config/redisClient";
import type { ICache } from "./ICache";

export class Cache implements ICache {
  async get(key: string): Promise<string | null> {
    return redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (ttlSeconds !== undefined) {
      await redis.set(key, value, "EX", ttlSeconds);
      return;
    }
    await redis.set(key, value);
  }

  async delete(key: string): Promise<void> {
    await redis.del(key);
  }

  async has(key: string): Promise<boolean> {
    return (await redis.exists(key)) > 0;
  }

  async clear(): Promise<void> {
    await redis.flushdb();
  }

  async keys(pattern: string): Promise<string[]> {
    return redis.keys(pattern);
  }

  async ttl(key: string): Promise<number> {
    return redis.ttl(key);
  }

  async expire(key: string, ttlSeconds: number): Promise<void> {
    await redis.expire(key, ttlSeconds);
  }

  async expireAt(key: string, at: Date | number): Promise<void> {
    const unixSeconds = at instanceof Date ? Math.floor(at.getTime() / 1000) : at;
    await redis.expireat(key, unixSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.get(key);
    if (value === null) {
      return null;
    }
    try {
      return JSON.parse(value) as T;
    } catch {
      return null;
    }
  }

  async setJson(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    await this.set(key, JSON.stringify(value), ttlSeconds);
  }
}
