import { z } from "../../openapi/zod";
import { paginationQuerySchema } from "../common/pagination.dto";
import { cuidSchema } from "../common/id.dto";
import { transactionDirectionSchema } from "../common/schemas";

export const recurringRuleListQuerySchema = paginationQuerySchema
  .extend({
    accountId: cuidSchema.optional(),
    frequencyId: cuidSchema.optional(),
    direction: transactionDirectionSchema.optional(),
  })
  .strict();

export type RecurringRuleListQueryDto = z.infer<typeof recurringRuleListQuerySchema>;
