import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import {
  dateRangeRefineConfig,
  hasValidDateRange,
  transactionDirectionSchema,
} from "../common/schemas";
import { paginationQuerySchema } from "../common/pagination.dto";

export const transactionListQuerySchema = paginationQuerySchema
  .extend({
    accountId: cuidSchema.optional(),
    categoryId: cuidSchema.optional(),
    direction: transactionDirectionSchema.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine(hasValidDateRange, dateRangeRefineConfig);

export type TransactionListQueryDto = z.infer<typeof transactionListQuerySchema>;
