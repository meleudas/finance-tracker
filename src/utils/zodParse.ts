import type { ZodType } from "zod";
import { validationError } from "./apiError";

export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw validationError(result.error.message);
  }
  return result.data;
}
