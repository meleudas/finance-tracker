import { z } from "zod";

export const amountSchema = z
  .number()
  .positive()
  .refine((val) => Number(val.toFixed(4)) === val, {
    message: "At most 4 decimal places",
  });

export const noteSchema = z.string().trim().max(500);
export const nullableNoteSchema = noteSchema.nullable().optional();

export const transactionDirectionSchema = z.enum(["INCOME", "EXPENSE"]);

// eslint-disable-next-line @typescript-eslint/no-deprecated
export const isoDatetimeSchema = z.string().datetime({ offset: true }).or(z.string().datetime());
export const dateToIsoString = (date: Date | null | undefined): string | null => {
  if (!date) return null;
  return date.toISOString();
};

export const optionalNoteSchema = z
  .string()
  .max(500)
  .optional()
  .or(z.literal(""))
  .or(z.null())
  .optional();

export function hasValidDateRange(data: { from?: Date; to?: Date }): boolean {
  return !data.from || !data.to || data.from <= data.to;
}

export const dateRangeRefineConfig = {
  message: "`from` must be before or equal to `to`",
  path: ["to"],
};

export function isNonEmptyPatch(data: Record<string, unknown>): boolean {
  return Object.keys(data).length > 0;
}

export const nonEmptyPatchRefineConfig = {
  message: "At least one field must be provided",
} as const;
