import { prisma } from "../../config/prismaClient";
import type {
  IBaseRepository,
  PaginatedResult,
  PaginationParams,
  RequestOptions,
} from "../interfaces/IBaseRepository";
import { withAbortSignal } from "../../utils/helpers/WithAbortSignal";

export interface PrismaDelegate {
  findUnique: (args: unknown) => Promise<unknown>;
  findMany: (args?: unknown) => Promise<unknown>;
  create: (args: unknown) => Promise<unknown>;
  update: (args: unknown) => Promise<unknown>;
  delete: (args: unknown) => Promise<unknown>;
  count: (args?: unknown) => Promise<unknown>;
}

export abstract class BaseRepository<T> implements IBaseRepository<T> {
  protected readonly prisma = prisma;

  protected abstract get delegate(): PrismaDelegate;

  private readonly activeFilter = { isDeleted: false };

  async findById(id: string, options?: RequestOptions): Promise<T | null> {
    return withAbortSignal(
      this.delegate.findUnique({
        where: { id, ...this.activeFilter },
      }) as Promise<T | null>,
      options?.signal,
    );
  }

  async findAll(options?: RequestOptions): Promise<T[]> {
    return withAbortSignal(
      this.delegate.findMany({
        where: this.activeFilter,
      }) as Promise<T[]>,
      options?.signal,
    );
  }

  async findMany(
    pagination: PaginationParams,
    options?: RequestOptions,
  ): Promise<PaginatedResult<T>> {
    const limit = Math.min(Math.max(1, pagination.limit), 100);
    const page = Math.max(1, pagination.page);
    const skip = (page - 1) * limit;

    const [data, total] = await withAbortSignal(
      Promise.all([
        this.delegate.findMany({
          where: this.activeFilter,
          skip,
          take: limit,
        }) as Promise<T[]>,
        this.delegate.count({ where: this.activeFilter }) as Promise<number>,
      ]),
      options?.signal,
    );

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async create(data: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return withAbortSignal(this.delegate.create({ data }) as Promise<T>, options?.signal);
  }

  async update(id: string, data: Record<string, unknown>, options?: RequestOptions): Promise<T> {
    return withAbortSignal(
      this.delegate.update({
        where: { id, ...this.activeFilter },
        data,
      }) as Promise<T>,
      options?.signal,
    );
  }

  async softDelete(id: string, options?: RequestOptions): Promise<T> {
    return withAbortSignal(this.delegate.delete({ where: { id } }) as Promise<T>, options?.signal);
  }

  async exists(id: string, options?: RequestOptions): Promise<boolean> {
    const result = await withAbortSignal(
      this.delegate.count({
        where: { id, ...this.activeFilter },
      }) as Promise<number>,
      options?.signal,
    );
    return result > 0;
  }

  async count(options?: RequestOptions): Promise<number> {
    return withAbortSignal(
      this.delegate.count({ where: this.activeFilter }) as Promise<number>,
      options?.signal,
    );
  }
}
