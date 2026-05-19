import type { RequestOptions } from "../repositories/interfaces/IBaseRepository";
import { withAbortSignal } from "../utils/withAbortSignal";

export interface ServiceContext {
  signal?: AbortSignal;
}

export function repoOptions(ctx?: ServiceContext): RequestOptions | undefined {
  if (!ctx?.signal) {
    return undefined;
  }
  return { signal: ctx.signal };
}

export function withServiceSignal<T>(promise: Promise<T>, ctx?: ServiceContext): Promise<T> {
  return withAbortSignal(promise, ctx?.signal);
}
