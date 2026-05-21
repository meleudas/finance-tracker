import { z } from "../../openapi/zod";
import { isNonEmptyPatch, nonEmptyPatchRefineConfig } from "../common/schemas";
import { recurringRuleBaseSchema } from "./CreateRecurringRule.dto";

export const UpdateRecurringRuleSchema = recurringRuleBaseSchema
  .partial()
  .strict()
  .refine(isNonEmptyPatch, nonEmptyPatchRefineConfig)
  .refine(
    (data) => {
      if (!data.nextRunAt || !data.endsAt) return true;
      return new Date(data.nextRunAt) < new Date(data.endsAt);
    },
    { message: "endsAt must be after nextRunAt", path: ["endsAt"] },
  );

export type UpdateRecurringRuleDto = z.infer<typeof UpdateRecurringRuleSchema>;
