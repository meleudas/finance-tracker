import type { RequestOptions } from "../repositories/interfaces/IBaseRepository";
import { withAbortSignal } from "../utils/helpers/withAbortSignal";

/**
 * HTTP/service-layer context passed from controllers via getServiceContext(req).
 * Cooperative cancellation: abort stops awaiting; Prisma, Redis, and S3 work may continue in the background.
 */
export interface ServiceContext {
  signal?: AbortSignal;
}

/** Maps ServiceContext to repository RequestOptions ({ signal }). */
export function repoOptions(ctx?: ServiceContext): RequestOptions | undefined {
  if (!ctx?.signal) {
    return undefined;
  }
  return { signal: ctx.signal };
}

/** Races a cache or external I/O promise against the request abort signal. */
export function withServiceSignal<T>(promise: Promise<T>, ctx?: ServiceContext): Promise<T> {
  return withAbortSignal(promise, ctx?.signal);
}
