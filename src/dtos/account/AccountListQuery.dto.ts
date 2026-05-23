import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.dto";
import { queryBooleanSchema } from "../common/query-schemas";

export const accountListQuerySchema = paginationQuerySchema.extend({
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  currencyId: z.string().cuid().optional(),
  includeDeleted: queryBooleanSchema(false),
});

export type AccountListQueryDto = z.infer<typeof accountListQuerySchema>;
