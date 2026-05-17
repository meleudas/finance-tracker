import { z } from "zod";
import { dateRangeRefineConfig, hasValidDateRange } from "./schemas";

export const dateRangeQuerySchema = z
  .object({
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine(hasValidDateRange, dateRangeRefineConfig);

export type DateRangeQueryDto = z.infer<typeof dateRangeQuerySchema>;
