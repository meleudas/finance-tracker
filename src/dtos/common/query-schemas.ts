import { z } from "zod";

const INVALID_DATE_MESSAGE = "Invalid date format. Use YYYY-MM-DD or ISO-8601";

function isValidDate(d: Date): boolean {
  return !Number.isNaN(d.getTime());
}

export function queryBooleanSchema(defaultValue = false) {
  return z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((v) => (v === undefined ? defaultValue : v === true || v === "true"));
}

export function optionalQueryBooleanSchema() {
  return z
    .union([z.boolean(), z.enum(["true", "false"])])
    .optional()
    .transform((v) => {
      if (v === undefined) {
        return undefined;
      }
      return v === true || v === "true";
    });
}

export function requiredCoercedDateSchema(fieldLabel: string) {
  return z
    .string({ error: `${fieldLabel} is required` })
    .min(1, { message: `${fieldLabel} is required` })
    .refine((s) => isValidDate(new Date(s)), { message: INVALID_DATE_MESSAGE })
    .transform((s) => new Date(s));
}

export const optionalCoercedDateSchema = z
  .string()
  .optional()
  .transform((v) => {
    if (v === undefined || v === "") {
      return undefined;
    }
    return new Date(v);
  })
  .refine((v) => v === undefined || isValidDate(v), { message: INVALID_DATE_MESSAGE });
