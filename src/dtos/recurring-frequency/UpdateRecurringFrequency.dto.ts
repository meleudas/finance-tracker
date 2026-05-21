import { z } from "../../openapi/zod";
import { isNonEmptyPatch, nonEmptyPatchRefineConfig } from "../common/schemas";
import { CreateRecurringFrequencySchema } from "./CreateRecurringFrequency.dto";

export const UpdateRecurringFrequencySchema = CreateRecurringFrequencySchema.partial()
  .strict()
  .refine(isNonEmptyPatch, nonEmptyPatchRefineConfig);

export type UpdateRecurringFrequencyDto = z.infer<typeof UpdateRecurringFrequencySchema>;
