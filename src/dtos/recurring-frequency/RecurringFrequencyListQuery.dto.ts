import { z } from "../../openapi/zod";
import { paginationQuerySchema } from "../common/pagination.dto";

export const recurringFrequencyListQuerySchema = paginationQuerySchema
  .extend({
    name: z.string().trim().min(1).max(100).optional(),
  })
  .strict();

export type RecurringFrequencyListQueryDto = z.infer<typeof recurringFrequencyListQuerySchema>;
