import { z } from "zod";

export const amountSchema = z
  .number()
  .positive()
  .refine((val) => Number(val.toFixed(4)) === val, {
    message: "At most 4 decimal places",
  });

export const noteSchema = z.string().trim().max(500);
export const optionalNoteSchema = noteSchema.optional();
export const nullableNoteSchema = noteSchema.nullable().optional();

export const transactionDirectionSchema = z.enum(["INCOME", "EXPENSE"]);

export const isoDatetimeSchema = z.iso.datetime();

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
