import type { RecurringRuleWithFrequency } from "../repositories/interfaces/IRecurringRuleRepository";
import type { RecurringRuleResponseDto } from "../dtos/recurring-rule/RecurringRuleResponse.dto";
import { decimalToNumber } from "../utils/helpers/decimalHelpers";
import { toRecurringFrequencyResponse } from "./recurring-frequency.mapper";

export function toRecurringRuleResponse(
  rule: RecurringRuleWithFrequency,
): RecurringRuleResponseDto {
  return {
    id: rule.id,
    name: rule.name,
    accountId: rule.accountId,
    currencyId: rule.currencyId,
    categoryId: rule.categoryId,
    frequencyId: rule.frequencyId,
    amount: decimalToNumber(rule.amount),
    direction: rule.direction,
    nextRunAt: rule.nextRunAt.toISOString(),
    endsAt: rule.endsAt?.toISOString() ?? null,
    maxOccurrences: rule.maxOccurrences,
    occurrenceCount: rule.occurrenceCount,
    frequency: toRecurringFrequencyResponse(rule.frequency),
    createdAt: rule.createdAt.toISOString(),
    updatedAt: rule.updatedAt.toISOString(),
  };
}
