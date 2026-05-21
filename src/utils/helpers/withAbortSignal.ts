//../src\utils\helpers\withAbortSignal.ts
import { AbortError } from "../errors/ClientErrors";

/**
 * Races a promise against an AbortSignal.
 * If the signal fires first, the returned promise rejects with AbortError.
 * The original promise is NOT cancelled (Prisma doesn't support that),
 * but the caller stops waiting.
 */
export function withAbortSignal<T>(promise: Promise<T>, signal?: AbortSignal): Promise<T> {
  if (!signal) return promise;
  if (signal.aborted) return Promise.reject(new AbortError());

  return new Promise<T>((resolve, reject) => {
    const onAbort = (): void => {
      reject(new AbortError());
    };
    signal.addEventListener("abort", onAbort, { once: true });

    promise.then(
      (value) => {
        signal.removeEventListener("abort", onAbort);
        resolve(value);
      },
      (err: unknown) => {
        signal.removeEventListener("abort", onAbort);
        if (err instanceof Error) {
          reject(err);
        } else {
          reject(new Error(String(err)));
        }
      },
    );
  });
}
