import { z } from "zod";
import { optionalCoercedDateSchema } from "./query-schemas";
import { dateRangeRefineConfig, hasValidDateRange } from "./schemas";

export const dateRangeQuerySchema = z
  .object({
    from: optionalCoercedDateSchema,
    to: optionalCoercedDateSchema,
  })
  .refine(hasValidDateRange, dateRangeRefineConfig);

export type DateRangeQueryDto = z.infer<typeof dateRangeQuerySchema>;
