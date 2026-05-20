import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { isoDatetimeSchema } from "../common/schemas";

export const CurrencyResponseSchema = z
  .object({
    id: cuidSchema,
    code: z.string().length(3),
    name: z.string().min(2).max(64),
    minorUnits: z.number().int().min(0).max(5),
    createdAt: isoDatetimeSchema,
    updatedAt: isoDatetimeSchema,
    deletedAt: isoDatetimeSchema.nullable(),
    isDeleted: z.boolean(),
  })
  .strict();

export type CurrencyResponseDto = z.infer<typeof CurrencyResponseSchema>;

export const PublicCurrencyResponseSchema = z
  .object({
    id: cuidSchema,
    code: z.string().length(3),
    name: z.string().min(2).max(64),
    minorUnits: z.number().int().min(0).max(5),
    createdAt: isoDatetimeSchema,
    updatedAt: isoDatetimeSchema,
  })
  .strict();

export type PublicCurrencyResponseDto = z.infer<typeof PublicCurrencyResponseSchema>;
