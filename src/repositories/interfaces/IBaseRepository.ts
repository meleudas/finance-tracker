export interface RequestOptions {
  signal?: AbortSignal;
}

export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface IBaseRepository<T> {
  findById(id: string, options?: RequestOptions): Promise<T | null>;
  findAll(options?: RequestOptions): Promise<T[]>;
  findMany(pagination: PaginationParams, options?: RequestOptions): Promise<PaginatedResult<T>>;
  create(data: Record<string, unknown>, options?: RequestOptions): Promise<T>;
  update(id: string, data: Record<string, unknown>, options?: RequestOptions): Promise<T>;
  softDelete(id: string, options?: RequestOptions): Promise<T>;
  exists(id: string, options?: RequestOptions): Promise<boolean>;
  count(options?: RequestOptions): Promise<number>;
}
