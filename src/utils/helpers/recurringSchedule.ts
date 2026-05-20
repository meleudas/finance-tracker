import type { RecurringIntervalUnit } from "../../generated/prisma/client";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface RecurringRuleScheduleState {
  occurrenceCount: number;
  maxOccurrences: number | null;
  endsAt: Date | null;
  nextRunAt: Date;
}

export function advanceNextRunAt(from: Date, every: number, unit: RecurringIntervalUnit): Date {
  const safeEvery = Math.max(1, every);

  if (unit === "DAY") {
    return new Date(from.getTime() + safeEvery * MS_PER_DAY);
  }

  if (unit === "WEEK") {
    return new Date(from.getTime() + safeEvery * 7 * MS_PER_DAY);
  }

  if (unit === "MONTH") {
    return addMonths(from, safeEvery);
  }

  return addYears(from, safeEvery);
}

function addMonths(date: Date, months: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  result.setUTCMonth(result.getUTCMonth() + months);
  if (result.getUTCDate() < day) {
    result.setUTCDate(0);
  }
  return result;
}

function addYears(date: Date, years: number): Date {
  const result = new Date(date.getTime());
  const day = result.getUTCDate();
  const month = result.getUTCMonth();
  result.setUTCFullYear(result.getUTCFullYear() + years);
  if (result.getUTCMonth() !== month || result.getUTCDate() < day) {
    result.setUTCDate(0);
  }
  return result;
}

export function isRuleExhausted(
  state: RecurringRuleScheduleState,
  nextRunAtAfterAdvance: Date,
): boolean {
  if (state.maxOccurrences != null && state.occurrenceCount >= state.maxOccurrences) {
    return true;
  }

  if (state.endsAt != null && nextRunAtAfterAdvance > state.endsAt) {
    return true;
  }

  return false;
}

/** Stops scheduling: next run far in the future so findDueRules skips the rule. */
export const RECURRING_RULE_EXHAUSTED_NEXT_RUN = new Date("2099-12-31T23:59:59.999Z");

export const RECURRING_CATCH_UP_MAX_PER_TICK = 10;

export const RECURRING_RUNS_IN_PERIOD_MAX = 1000;

export interface CountRunsInPeriodInput {
  nextRunAt: Date;
  every: number;
  unit: RecurringIntervalUnit;
  periodStart: Date;
  periodEnd: Date;
  endsAt: Date | null;
  maxOccurrences: number | null;
  occurrenceCount: number;
}

/** Simulates scheduled run dates within [periodStart, periodEnd]. */
export function countRunsInPeriod(input: CountRunsInPeriodInput): number {
  const { periodStart, periodEnd, endsAt, maxOccurrences, occurrenceCount } = input;
  let runs = 0;
  let cursor = new Date(Math.max(input.nextRunAt.getTime(), periodStart.getTime()));

  while (cursor <= periodEnd && runs < RECURRING_RUNS_IN_PERIOD_MAX) {
    if (endsAt != null && cursor > endsAt) break;
    if (maxOccurrences != null && occurrenceCount + runs >= maxOccurrences) break;

    runs += 1;
    const next = advanceNextRunAt(cursor, input.every, input.unit);
    if (next.getTime() <= cursor.getTime()) break;
    cursor = next;
  }

  return runs;
}

export function formatFrequencyLabel(every: number, unit: RecurringIntervalUnit): string {
  const unitLabel = unit.toLowerCase();
  return every === 1 ? `Every ${unitLabel}` : `Every ${String(every)} ${unitLabel}s`;
}
