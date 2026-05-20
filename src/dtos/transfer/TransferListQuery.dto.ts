import { z } from "zod";
import { cuidSchema } from "../common/id.dto";
import { dateRangeRefineConfig, hasValidDateRange } from "../common/schemas";
import { paginationQuerySchema } from "../common/pagination.dto";

export const transferListQuerySchema = paginationQuerySchema
  .extend({
    fromAccountId: cuidSchema.optional(),
    toAccountId: cuidSchema.optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional(),
  })
  .refine(hasValidDateRange, dateRangeRefineConfig);

export type TransferListQueryDto = z.infer<typeof transferListQuerySchema>;
