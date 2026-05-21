import { z, type ZodType } from "zod";
import { ValidationError } from "../errors/ClientErrors";

export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    throw new ValidationError(result.error.message, z.treeifyError(result.error));
  }
  return result.data;
}
