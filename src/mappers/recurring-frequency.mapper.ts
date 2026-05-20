import type { RecurringFrequency } from "../generated/prisma/client";
import type { RecurringFrequencyResponseDto } from "../dtos/recurring-frequency/RecurringFrequencyResponse.dto";

export function toRecurringFrequencyResponse(
  frequency: RecurringFrequency,
): RecurringFrequencyResponseDto {
  return {
    id: frequency.id,
    name: frequency.name,
    every: frequency.every,
    unit: frequency.unit,
    createdAt: frequency.createdAt.toISOString(),
    updatedAt: frequency.updatedAt.toISOString(),
  };
}
