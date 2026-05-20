import type { PaginatedResult } from "../repositories/interfaces/IBaseRepository";

export function paginateArray<T>(items: T[], page: number, limit: number): PaginatedResult<T> {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(Math.max(1, limit), 100);
  const total = items.length;
  const skip = (safePage - 1) * safeLimit;

  return {
    data: items.slice(skip, skip + safeLimit),
    total,
    page: safePage,
    limit: safeLimit,
    totalPages: Math.max(1, Math.ceil(total / safeLimit)),
  };
}
