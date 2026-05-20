import { z } from "zod";
import { paginationQuerySchema } from "../common/pagination.dto";

export const accountListQuerySchema = paginationQuerySchema.extend({
  // eslint-disable-next-line @typescript-eslint/no-deprecated
  currencyId: z.string().cuid().optional(),
  includeDeleted: z.boolean().optional().default(false),
});

export type AccountListQueryDto = z.infer<typeof accountListQuerySchema>;
